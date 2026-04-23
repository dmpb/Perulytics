import { Injectable } from '@nestjs/common';
import { CandidateResultRepository } from '../../repositories/candidate-result.repository';
import { ElectionRepository } from '../../repositories/election.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly electionRepository: ElectionRepository,
    private readonly candidateResultRepository: CandidateResultRepository,
  ) {}

  private async getElection() {
    const onpeElectionId = Number(process.env.ONPE_ELECTION_ID ?? 10);
    const tipoFiltro = process.env.ONPE_TIPO_FILTRO ?? 'eleccion';
    return this.electionRepository.getOrCreate(onpeElectionId, tipoFiltro);
  }

  async getResultsByCandidates(codigosAgrupacionPolitica?: number[]) {
    const election = await this.getElection();
    const snapshots =
      await this.candidateResultRepository.getLastTwoSnapshotsWithResults(
        election.id,
      );
    if (snapshots.length === 0) {
      return {
        currentSnapshotTimestamp: null,
        previousSnapshotTimestamp: null,
        results: [],
      };
    }

    const [current, previous] = snapshots;
    const previousByCode = new Map<
      number,
      {
        totalVotosValidos: number;
        porcentajeVotosValidos: number;
      }
    >(
      (previous?.candidateResults ?? []).map((item) => [
        item.candidate.codigoAgrupacionPolitica,
        {
          totalVotosValidos: item.totalVotosValidos,
          porcentajeVotosValidos: item.porcentajeVotosValidos,
        },
      ]),
    );

    const codigosFiltro = codigosAgrupacionPolitica?.length
      ? new Set(codigosAgrupacionPolitica)
      : null;

    const results = current.candidateResults
      .filter((item) =>
        codigosFiltro ? codigosFiltro.has(item.candidate.codigoAgrupacionPolitica) : true,
      )
      .map((item) => {
        const previousResult = previousByCode.get(
          item.candidate.codigoAgrupacionPolitica,
        );

        const votosAnteriores = previousResult?.totalVotosValidos ?? 0;
        const porcentajeAnterior = previousResult?.porcentajeVotosValidos ?? 0;

        return {
          codigoAgrupacionPolitica: item.candidate.codigoAgrupacionPolitica,
          nombreAgrupacionPolitica: item.candidate.nombreAgrupacionPolitica,
          nombreCandidato: item.candidate.nombreCandidato,
          totalVotosValidos: item.totalVotosValidos,
          porcentajeVotosValidos: item.porcentajeVotosValidos,
          porcentajeVotosEmitidos: item.porcentajeVotosEmitidos,
          comparativoAnterior: {
            totalVotosValidos: votosAnteriores,
            porcentajeVotosValidos: porcentajeAnterior,
            deltaVotosValidos: item.totalVotosValidos - votosAnteriores,
            deltaPorcentajeVotosValidos:
              item.porcentajeVotosValidos - porcentajeAnterior,
          },
        };
      })
      .sort((a, b) => b.porcentajeVotosValidos - a.porcentajeVotosValidos);

    return {
      currentSnapshotTimestamp: current.timestamp,
      previousSnapshotTimestamp: previous?.timestamp ?? null,
      results,
    };
  }

  async getTrends(codigoAgrupacionPolitica: number, limit = 120) {
    const election = await this.getElection();
    const points = await this.candidateResultRepository.getCandidateTrend(
      election.id,
      codigoAgrupacionPolitica,
      limit,
    );

    return points.map((item) => ({
      timestamp: item.snapshot.timestamp,
      porcentajeVotosValidos: item.porcentajeVotosValidos,
      porcentajeVotosEmitidos: item.porcentajeVotosEmitidos,
      totalVotosValidos: item.totalVotosValidos,
    }));
  }
}
