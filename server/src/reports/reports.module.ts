import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ReportAgentService } from './report-agent.service';
import { ReportEvaluatorService } from './report-evaluator.service';
import { ReportToolsService } from './report-tools.service';
import { ReportRunStore } from './report-run.store';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [MetricsService, ReportToolsService, ReportRunStore, ReportEvaluatorService, ReportAgentService],
})
export class ReportsModule {}
