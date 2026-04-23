import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics/analytics.service';
import { ok } from '../utils/api-response.util';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('results')
  async results(@Query('codigos') codigos?: string) {
    const parsedCodigos = codigos
      ? codigos
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isFinite(item))
      : undefined;
    const data =
      await this.analyticsService.getResultsByCandidates(parsedCodigos);
    return ok(data);
  }

  @Get('trends')
  async trends(
    @Query('codigoAgrupacionPolitica', ParseIntPipe)
    codigoAgrupacionPolitica: number,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 120;
    const data = await this.analyticsService.getTrends(
      codigoAgrupacionPolitica,
      parsedLimit,
    );
    return ok(data);
  }
}
