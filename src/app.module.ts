import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { ElectionModule } from './modules/election/election.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, ElectionModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
