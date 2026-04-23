import { Injectable } from '@nestjs/common';
import { Election } from '@prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';

@Injectable()
export class ElectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(onpeElectionId: number, tipoFiltro: string): Promise<Election> {
    return this.prisma.election.upsert({
      where: { onpeElectionId },
      update: { tipoFiltro },
      create: {
        onpeElectionId,
        tipoFiltro,
      },
    });
  }
}
