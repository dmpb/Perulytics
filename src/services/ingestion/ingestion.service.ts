import { Injectable, Logger } from '@nestjs/common';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateResultRepository } from '../../repositories/candidate-result.repository';
import { ElectionRepository } from '../../repositories/election.repository';
import { SnapshotRepository } from '../../repositories/snapshot.repository';
import { OnpeClientService } from './onpe-client.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly onpeClientService: OnpeClientService,
    private readonly electionRepository: ElectionRepository,
    private readonly snapshotRepository: SnapshotRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateResultRepository: CandidateResultRepository,
  ) {}

  async runIngestion() {
    const onpeElectionId = Number(process.env.ONPE_ELECTION_ID ?? 10);
    const tipoFiltro = process.env.ONPE_TIPO_FILTRO ?? 'eleccion';

    this.logger.log(
      `Iniciando ingesta ONPE: eleccion=${onpeElectionId}, filtro=${tipoFiltro}`,
    );

    const [totals, participants] = await Promise.all([
      this.onpeClientService.getTotals(onpeElectionId, tipoFiltro),
      this.onpeClientService.getParticipants(onpeElectionId, tipoFiltro),
    ]);

    const election = await this.electionRepository.getOrCreate(
      onpeElectionId,
      tipoFiltro,
    );
    const latestSnapshot = await this.snapshotRepository.findLatestByElectionId(
      election.id,
    );
    const incomingTimestamp = new Date(totals.fechaActualizacion);

    if (
      latestSnapshot &&
      latestSnapshot.timestamp.getTime() === incomingTimestamp.getTime()
    ) {
      this.logger.log('Snapshot omitido: timestamp repetido');
      return {
        created: false,
        reason: 'duplicate_timestamp',
        timestamp: incomingTimestamp,
      };
    }

    const snapshot = await this.snapshotRepository.createFromTotals(
      election.id,
      totals,
    );
    const candidates = await this.candidateRepository.upsertMany(participants);
    const candidateByCode = new Map(
      candidates.map((item) => [item.codigoAgrupacionPolitica, item.id]),
    );

    await this.candidateResultRepository.createMany(
      snapshot.id,
      participants
        .map((participant) => {
          const candidateId = candidateByCode.get(
            participant.codigoAgrupacionPolitica,
          );
          if (!candidateId) {
            return null;
          }
          return {
            candidateId,
            totalVotosValidos: participant.totalVotosValidos,
            porcentajeVotosValidos: participant.porcentajeVotosValidos,
            porcentajeVotosEmitidos: participant.porcentajeVotosEmitidos,
          };
        })
        .filter(
          (
            item,
          ): item is {
            candidateId: string;
            totalVotosValidos: number;
            porcentajeVotosValidos: number;
            porcentajeVotosEmitidos: number;
          } => item !== null,
        ),
    );

    this.logger.log(
      `Snapshot creado ${snapshot.id} con ${participants.length} participantes`,
    );

    return {
      created: true,
      snapshotId: snapshot.id,
      participants: participants.length,
      timestamp: snapshot.timestamp,
    };
  }
}
