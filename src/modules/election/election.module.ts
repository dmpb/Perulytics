import { Module } from '@nestjs/common';
import { AnalyticsController } from '../../controllers/analytics.controller';
import { AnalyticsService } from '../../services/analytics/analytics.service';
import { AnalyticsCalculatorService } from '../../services/analytics/analytics-calculator.service';
import { IngestionService } from '../../services/ingestion/ingestion.service';
import { OnpeClientService } from '../../services/ingestion/onpe-client.service';
import { CandidateRepository } from '../../repositories/candidate.repository';
import { CandidateResultRepository } from '../../repositories/candidate-result.repository';
import { ElectionRepository } from '../../repositories/election.repository';
import { IngestionRunRepository } from '../../repositories/ingestion-run.repository';
import { SnapshotRepository } from '../../repositories/snapshot.repository';
import { IngestionController } from '../../controllers/ingestion.controller';
import { IngestionJob } from '../../jobs/ingestion.job';

@Module({
  controllers: [AnalyticsController, IngestionController],
  providers: [
    AnalyticsService,
    AnalyticsCalculatorService,
    IngestionService,
    OnpeClientService,
    ElectionRepository,
    IngestionRunRepository,
    SnapshotRepository,
    CandidateRepository,
    CandidateResultRepository,
    IngestionJob,
  ],
})
export class ElectionModule {}
