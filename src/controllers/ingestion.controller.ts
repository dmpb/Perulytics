import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { IngestionService } from '../services/ingestion/ingestion.service';
import { ok } from '../utils/api-response.util';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('run')
  @HttpCode(200)
  async runIngestion() {
    const data = await this.ingestionService.runIngestion();
    return ok(data);
  }

  @Get('status')
  async status() {
    const data = await this.ingestionService.getIngestionStatus();
    return ok(data);
  }
}
