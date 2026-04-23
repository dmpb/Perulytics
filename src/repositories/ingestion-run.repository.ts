import { Injectable } from '@nestjs/common';
import { IngestionRun, Prisma } from '@prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';

@Injectable()
export class IngestionRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStarted(electionId: string): Promise<IngestionRun> {
    return this.prisma.ingestionRun.create({
      data: {
        electionId,
        status: 'running',
      },
    });
  }

  async markSuccess(
    runId: string,
    params: {
      snapshotCreated: boolean;
      snapshotId?: string;
      details?: Prisma.InputJsonValue;
      durationMs: number;
      endedAt: Date;
    },
  ): Promise<IngestionRun> {
    return this.prisma.ingestionRun.update({
      where: { id: runId },
      data: {
        status: 'success',
        snapshotCreated: params.snapshotCreated,
        snapshotId: params.snapshotId ?? null,
        details: params.details,
        durationMs: params.durationMs,
        endedAt: params.endedAt,
      },
    });
  }

  async markFailed(
    runId: string,
    params: {
      errorMessage: string;
      details?: Prisma.InputJsonValue;
      durationMs: number;
      endedAt: Date;
    },
  ): Promise<IngestionRun> {
    return this.prisma.ingestionRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        errorMessage: params.errorMessage,
        details: params.details,
        durationMs: params.durationMs,
        endedAt: params.endedAt,
      },
    });
  }

  async findLatestByElectionId(electionId: string): Promise<IngestionRun | null> {
    return this.prisma.ingestionRun.findFirst({
      where: { electionId },
      orderBy: { startedAt: 'desc' },
    });
  }
}
