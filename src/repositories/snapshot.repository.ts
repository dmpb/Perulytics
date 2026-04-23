import { Injectable } from '@nestjs/common';
import { Snapshot } from '@prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';
import { OnpeTotalsData } from '../services/ingestion/dto/onpe-response.dto';

@Injectable()
export class SnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestByElectionId(electionId: string): Promise<Snapshot | null> {
    return this.prisma.snapshot.findFirst({
      where: { electionId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async createFromTotals(
    electionId: string,
    totals: OnpeTotalsData,
  ): Promise<Snapshot> {
    return this.prisma.snapshot.create({
      data: {
        electionId,
        timestamp: new Date(totals.fechaActualizacion),
        actasContabilizadas: totals.actasContabilizadas,
        contabilizadas: totals.contabilizadas,
        totalActas: totals.totalActas,
        participacionCiudadana: totals.participacionCiudadana,
        actasEnviadasJee: totals.actasEnviadasJee,
        enviadasJee: totals.enviadasJee,
        actasPendientesJee: totals.actasPendientesJee,
        pendientesJee: totals.pendientesJee,
        idUbigeoDepartamento: totals.idUbigeoDepartamento,
        idUbigeoProvincia: totals.idUbigeoProvincia,
        idUbigeoDistrito: totals.idUbigeoDistrito,
        idUbigeoDistritoElectoral: totals.idUbigeoDistritoElectoral,
        totalVotosEmitidos: totals.totalVotosEmitidos,
        totalVotosValidos: totals.totalVotosValidos,
        porcentajeVotosEmitidos: totals.porcentajeVotosEmitidos,
        porcentajeVotosValidos: totals.porcentajeVotosValidos,
      },
    });
  }
}
