import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics/analytics.service';
import { ok } from '../utils/api-response.util';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('top3')
  async top3() {
    const data = await this.analyticsService.getTop3();
    return ok(data);
  }

  @Get('momentum')
  async momentum() {
    const data = await this.analyticsService.getMomentum();
    return ok(data);
  }

  @Get('critical-difference')
  async criticalDifference() {
    const data = await this.analyticsService.getCriticalDifference();
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
