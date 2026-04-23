import { Injectable } from '@nestjs/common';
import { CandidateResultRepository } from '../../repositories/candidate-result.repository';
import { ElectionRepository } from '../../repositories/election.repository';
import { AnalyticsCalculatorService } from './analytics-calculator.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly electionRepository: ElectionRepository,
    private readonly candidateResultRepository: CandidateResultRepository,
    private readonly analyticsCalculator: AnalyticsCalculatorService,
  ) {}

  private async getElection() {
    const onpeElectionId = Number(process.env.ONPE_ELECTION_ID ?? 10);
    const tipoFiltro = process.env.ONPE_TIPO_FILTRO ?? 'eleccion';
    return this.electionRepository.getOrCreate(onpeElectionId, tipoFiltro);
  }

  async getTop3() {
    const election = await this.getElection();
    const latest = await this.candidateResultRepository.getLatestWithCandidate(
      election.id,
    );
    const mapped = latest.results.map((item) => ({
      codigoAgrupacionPolitica: item.candidate.codigoAgrupacionPolitica,
      nombreAgrupacionPolitica: item.candidate.nombreAgrupacionPolitica,
      nombreCandidato: item.candidate.nombreCandidato,
      totalVotosValidos: item.totalVotosValidos,
      porcentajeVotosValidos: item.porcentajeVotosValidos,
      porcentajeVotosEmitidos: item.porcentajeVotosEmitidos,
    }));

    return {
      snapshotTimestamp: latest.snapshot?.timestamp ?? null,
      top3: this.analyticsCalculator.getTop3(mapped),
    };
  }

  async getMomentum() {
    const election = await this.getElection();
    const snapshots =
      await this.candidateResultRepository.getLastTwoSnapshotsWithResults(
        election.id,
      );
    if (snapshots.length < 2) {
      return [];
    }

    const [current, previous] = snapshots;
    const currentMapped = current.candidateResults.map((item) => ({
      codigoAgrupacionPolitica: item.candidate.codigoAgrupacionPolitica,
      nombreAgrupacionPolitica: item.candidate.nombreAgrupacionPolitica,
      nombreCandidato: item.candidate.nombreCandidato,
      totalVotosValidos: item.totalVotosValidos,
      porcentajeVotosValidos: item.porcentajeVotosValidos,
      porcentajeVotosEmitidos: item.porcentajeVotosEmitidos,
    }));
    const previousMapped = previous.candidateResults.map((item) => ({
      codigoAgrupacionPolitica: item.candidate.codigoAgrupacionPolitica,
      nombreAgrupacionPolitica: item.candidate.nombreAgrupacionPolitica,
      nombreCandidato: item.candidate.nombreCandidato,
      totalVotosValidos: item.totalVotosValidos,
      porcentajeVotosValidos: item.porcentajeVotosValidos,
      porcentajeVotosEmitidos: item.porcentajeVotosEmitidos,
    }));

    return this.analyticsCalculator.getMomentum(currentMapped, previousMapped);
  }

  async getCriticalDifference() {
    const top = await this.getTop3();
    return this.analyticsCalculator.getCriticalDifference(top.top3);
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
