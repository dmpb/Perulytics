import { Injectable } from '@nestjs/common';
import { Candidate } from '@prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';
import { OnpeParticipantData } from '../services/ingestion/dto/onpe-response.dto';

@Injectable()
export class CandidateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(participants: OnpeParticipantData[]): Promise<Candidate[]> {
    const candidates: Candidate[] = [];

    for (const participant of participants) {
      const candidate = await this.prisma.candidate.upsert({
        where: {
          codigoAgrupacionPolitica: participant.codigoAgrupacionPolitica,
        },
        update: {
          nombreAgrupacionPolitica: participant.nombreAgrupacionPolitica,
          nombreCandidato: participant.nombreCandidato,
          dniCandidato: participant.dniCandidato,
        },
        create: {
          codigoAgrupacionPolitica: participant.codigoAgrupacionPolitica,
          nombreAgrupacionPolitica: participant.nombreAgrupacionPolitica,
          nombreCandidato: participant.nombreCandidato,
          dniCandidato: participant.dniCandidato,
        },
      });

      candidates.push(candidate);
    }

    return candidates;
  }
}
