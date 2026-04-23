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
  private readonly browserHeaders: Record<string, string> = {
    accept: '*/*',
    'accept-language': 'es-PE,es;q=0.9,en;q=0.8',
    'content-type': 'application/json',
    priority: 'u=1, i',
    referer: 'https://resultadoelectoral.onpe.gob.pe/main/resumen',
    'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
  };

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const cookie = this.resolveCookie();
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          ...this.browserHeaders,
          ...(cookie ? { cookie } : {}),
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      this.logger.error(`Fallo request ONPE ${url}: ${response.status}`);
      throw new Error(`ONPE respondió con estado ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? 'unknown';
    const text = await response.text();
    if (!contentType.includes('application/json')) {
      const snippet = text.slice(0, 200).replace(/\s+/g, ' ').trim();
      this.logger.error(
        `Respuesta no JSON de ONPE (${contentType}) en ${path}. Inicio: ${snippet}`,
      );
      throw new Error(
        'ONPE no devolvio JSON (posible bloqueo anti-bot). Configura ONPE_COOKIE u ONPE_COOKIE_BASE64 en .env.',
      );
    }

    const payload = JSON.parse(text) as OnpeApiResponse<T>;
    if (!payload.success) {
      throw new Error(`ONPE devolvió success=false para ${path}`);
    }

    return payload;
  }

  private resolveCookie(): string | undefined {
    if (process.env.ONPE_COOKIE?.trim()) {
      return process.env.ONPE_COOKIE.trim();
    }

    const cookieBase64 = process.env.ONPE_COOKIE_BASE64?.trim();
    if (!cookieBase64) {
      return undefined;
    }

    try {
      return Buffer.from(cookieBase64, 'base64').toString('utf8').trim();
    } catch {
      this.logger.warn('ONPE_COOKIE_BASE64 invalido; se omitira header cookie');
      return undefined;
    }
  }
}
