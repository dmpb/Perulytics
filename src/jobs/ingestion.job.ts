import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IngestionService } from '../services/ingestion/ingestion.service';

@Injectable()
export class IngestionJob {
  private readonly logger = new Logger(IngestionJob.name);

  constructor(private readonly ingestionService: IngestionService) {}

  @Cron('0 */2 * * * *')
  async execute(): Promise<void> {
    try {
      const result = await this.ingestionService.runIngestion();
      this.logger.log(`Ejecucion de ingesta completada: ${JSON.stringify(result)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Error en ingestion job: ${message}`);
    }
  }
}
