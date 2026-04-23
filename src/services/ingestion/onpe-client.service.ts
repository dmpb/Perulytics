import { Injectable, Logger } from '@nestjs/common';
import {
  OnpeApiResponse,
  OnpeParticipantData,
  OnpeTotalsData,
} from './dto/onpe-response.dto';

@Injectable()
export class OnpeClientService {
  private readonly logger = new Logger(OnpeClientService.name);
  private readonly baseUrl =
    'https://resultadoelectoral.onpe.gob.pe/presentacion-backend';

  async getTotals(
    idEleccion: number,
    tipoFiltro: string,
  ): Promise<OnpeTotalsData> {
    const query = new URLSearchParams({
      idEleccion: String(idEleccion),
      tipoFiltro,
    });
    const payload = await this.get<OnpeTotalsData>(
      `/resumen-general/totales?${query.toString()}`,
    );
    return payload.data;
  }

  async getParticipants(
    idEleccion: number,
    tipoFiltro: string,
  ): Promise<OnpeParticipantData[]> {
    const query = new URLSearchParams({
      idEleccion: String(idEleccion),
      tipoFiltro,
    });
    const payload = await this.get<OnpeParticipantData[]>(
      `/resumen-general/participantes?${query.toString()}`,
    );
    return payload.data;
  }

  private async get<T>(path: string): Promise<OnpeApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        accept: '*/*',
        referer: 'https://resultadoelectoral.onpe.gob.pe/main/resumen',
      },
    });

    if (!response.ok) {
      this.logger.error(`Fallo request ONPE ${url}: ${response.status}`);
      throw new Error(`ONPE respondió con estado ${response.status}`);
    }

    const payload = (await response.json()) as OnpeApiResponse<T>;
    if (!payload.success) {
      throw new Error(`ONPE devolvió success=false para ${path}`);
    }

    return payload;
  }
}
