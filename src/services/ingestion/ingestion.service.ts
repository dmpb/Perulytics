import { Injectable, Logger } from '@nestjs/common';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateResultRepository } from '../../repositories/candidate-result.repository';
import { ElectionRepository } from '../../repositories/election.repository';
import { IngestionRunRepository } from '../../repositories/ingestion-run.repository';
import { SnapshotRepository } from '../../repositories/snapshot.repository';
import { OnpeClientService } from './onpe-client.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly onpeClientService: OnpeClientService,
    private readonly electionRepository: ElectionRepository,
    private readonly snapshotRepository: SnapshotRepository,
    private readonly ingestionRunRepository: IngestionRunRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly candidateResultRepository: CandidateResultRepository,
  ) {}

  async runIngestion() {
    const onpeElectionId = Number(process.env.ONPE_ELECTION_ID ?? 10);
    const tipoFiltro = process.env.ONPE_TIPO_FILTRO ?? 'eleccion';
    const election = await this.electionRepository.getOrCreate(
      onpeElectionId,
      tipoFiltro,
    );
    const runStartedAt = Date.now();
    const run = await this.ingestionRunRepository.createStarted(election.id);

    this.logger.log(
      `[run:${run.id}] Iniciando ingesta ONPE: eleccion=${onpeElectionId}, filtro=${tipoFiltro}`,
    );

    try {
      const [totals, participants] = await Promise.all([
        this.withRetry(
          () => this.onpeClientService.getTotals(onpeElectionId, tipoFiltro),
          `totales-e${onpeElectionId}`,
        ),
        this.withRetry(
          () => this.onpeClientService.getParticipants(onpeElectionId, tipoFiltro),
          `participantes-e${onpeElectionId}`,
        ),
      ]);
      const latestSnapshot = await this.snapshotRepository.findLatestByElectionId(
        election.id,
      );
      const incomingTimestamp = new Date(totals.fechaActualizacion);

      if (
        latestSnapshot &&
        latestSnapshot.timestamp.getTime() === incomingTimestamp.getTime()
      ) {
        this.logger.log(`[run:${run.id}] Snapshot omitido: timestamp repetido`);
        const result = {
          created: false,
          reason: 'duplicate_timestamp',
          timestamp: incomingTimestamp,
          runId: run.id,
        };
        await this.ingestionRunRepository.markSuccess(run.id, {
          snapshotCreated: false,
          details: result,
          endedAt: new Date(),
          durationMs: Date.now() - runStartedAt,
        });
        return result;
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
        `[run:${run.id}] Snapshot creado ${snapshot.id} con ${participants.length} participantes`,
      );

      const result = {
        created: true,
        snapshotId: snapshot.id,
        participants: participants.length,
        timestamp: snapshot.timestamp,
        runId: run.id,
      };

      await this.ingestionRunRepository.markSuccess(run.id, {
        snapshotCreated: true,
        snapshotId: snapshot.id,
        details: result,
        endedAt: new Date(),
        durationMs: Date.now() - runStartedAt,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      await this.ingestionRunRepository.markFailed(run.id, {
        errorMessage: message,
        details: {
          onpeElectionId,
          tipoFiltro,
        },
        endedAt: new Date(),
        durationMs: Date.now() - runStartedAt,
      });
      this.logger.error(`[run:${run.id}] Error de ingesta: ${message}`);
      throw error;
    }
  }

  async getIngestionStatus() {
    const onpeElectionId = Number(process.env.ONPE_ELECTION_ID ?? 10);
    const tipoFiltro = process.env.ONPE_TIPO_FILTRO ?? 'eleccion';
    const election = await this.electionRepository.getOrCreate(
      onpeElectionId,
      tipoFiltro,
    );

    const [latestRun, latestSnapshot] = await Promise.all([
      this.ingestionRunRepository.findLatestByElectionId(election.id),
      this.snapshotRepository.findLatestByElectionId(election.id),
    ]);

    return {
      election: {
        id: election.id,
        onpeElectionId: election.onpeElectionId,
        tipoFiltro: election.tipoFiltro,
      },
      latestRun: latestRun
        ? {
            id: latestRun.id,
            status: latestRun.status,
            startedAt: latestRun.startedAt,
            endedAt: latestRun.endedAt,
            durationMs: latestRun.durationMs,
            snapshotCreated: latestRun.snapshotCreated,
            snapshotId: latestRun.snapshotId,
            errorMessage: latestRun.errorMessage,
          }
        : null,
      latestSnapshot,
    };
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    label: string,
    retries = 3,
    baseDelayMs = 1000,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Fallo ${label} intento ${attempt}/${retries}: ${message}`,
        );
        if (attempt < retries) {
          const delay = baseDelayMs * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
