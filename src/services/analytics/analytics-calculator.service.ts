import { Injectable } from '@nestjs/common';

export interface CandidateMetric {
  codigoAgrupacionPolitica: number;
  nombreAgrupacionPolitica: string;
  nombreCandidato: string;
  totalVotosValidos: number;
  porcentajeVotosValidos: number;
  porcentajeVotosEmitidos: number;
}

export interface SnapshotWithCandidates {
  timestamp: Date;
  candidateResults: CandidateMetric[];
}

@Injectable()
export class AnalyticsCalculatorService {
  getTop3(candidates: CandidateMetric[]): CandidateMetric[] {
    return [...candidates]
      .sort((a, b) => b.porcentajeVotosValidos - a.porcentajeVotosValidos)
      .slice(0, 3);
  }

  getMomentum(
    current: CandidateMetric[],
    previous: CandidateMetric[],
  ): Array<CandidateMetric & { momentum: number }> {
    const previousByCandidate = new Map(
      previous.map((item) => [item.codigoAgrupacionPolitica, item]),
    );

    return current
      .map((item) => {
        const previousItem = previousByCandidate.get(item.codigoAgrupacionPolitica);
        return {
          ...item,
          momentum:
            item.porcentajeVotosValidos -
            (previousItem?.porcentajeVotosValidos ?? item.porcentajeVotosValidos),
        };
      })
      .sort((a, b) => b.momentum - a.momentum);
  }

  getCriticalDifference(candidates: CandidateMetric[]) {
    const sorted = [...candidates].sort(
      (a, b) => b.porcentajeVotosValidos - a.porcentajeVotosValidos,
    );
    const second = sorted[1];
    const third = sorted[2];

    if (!second || !third) {
      return null;
    }

    return {
      candidate2: second,
      candidate3: third,
      diferencia: second.porcentajeVotosValidos - third.porcentajeVotosValidos,
    };
  }

  getTrendFromSnapshots(
    snapshots: SnapshotWithCandidates[],
    codigoAgrupacionPolitica: number,
  ) {
    return snapshots
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((snapshot) => {
        const candidate = snapshot.candidateResults.find(
          (result) => result.codigoAgrupacionPolitica === codigoAgrupacionPolitica,
        );
        return {
          timestamp: snapshot.timestamp,
          porcentajeVotosValidos: candidate?.porcentajeVotosValidos ?? 0,
          totalVotosValidos: candidate?.totalVotosValidos ?? 0,
        };
      });
  }
}
