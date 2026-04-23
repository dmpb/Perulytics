import { Injectable } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';

interface CandidateResultInsert {
  candidateId: string;
  totalVotosValidos: number;
  porcentajeVotosValidos: number;
  porcentajeVotosEmitidos: number;
}

@Injectable()
export class CandidateResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    snapshotId: string,
    candidateResults: CandidateResultInsert[],
  ): Promise<void> {
    await this.prisma.candidateResult.createMany({
      data: candidateResults.map((item) => ({
        snapshotId,
        candidateId: item.candidateId,
        totalVotosValidos: item.totalVotosValidos,
        porcentajeVotosValidos: item.porcentajeVotosValidos,
        porcentajeVotosEmitidos: item.porcentajeVotosEmitidos,
      })),
      skipDuplicates: true,
    });
  }

  async getLatestWithCandidate(electionId: string) {
    const latestSnapshot = await this.prisma.snapshot.findFirst({
      where: { electionId },
      orderBy: { timestamp: 'desc' },
      select: { id: true, timestamp: true },
    });

    if (!latestSnapshot) {
      return { snapshot: null, results: [] };
    }

    const results = await this.prisma.candidateResult.findMany({
      where: { snapshotId: latestSnapshot.id },
      include: {
        candidate: true,
      },
      orderBy: { porcentajeVotosValidos: 'desc' },
    });

    return {
      snapshot: latestSnapshot,
      results,
    };
  }

  async getLastTwoSnapshotsWithResults(electionId: string) {
    const snapshots = await this.prisma.snapshot.findMany({
      where: { electionId },
      orderBy: { timestamp: 'desc' },
      take: 2,
      include: {
        candidateResults: {
          include: { candidate: true },
        },
      },
    });

    return snapshots;
  }

  async getCandidateTrend(
    electionId: string,
    codigoAgrupacionPolitica: number,
    limit = 100,
  ) {
    return this.prisma.candidateResult.findMany({
      where: {
        candidate: { codigoAgrupacionPolitica },
        snapshot: { electionId },
      },
      include: {
        snapshot: {
          select: { timestamp: true },
        },
      },
      orderBy: {
        snapshot: { timestamp: 'asc' },
      },
      take: limit,
    });
  }
}
