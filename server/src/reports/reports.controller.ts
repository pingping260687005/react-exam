import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportAgentService } from './report-agent.service';
import { reportEvaluationCases } from './evaluation-cases';
import { ReportRunStore } from './report-run.store';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly agent: ReportAgentService,
    private readonly runs: ReportRunStore
  ) {}

  @Post('generate')
  generate(@Body() input: GenerateReportDto) {
    return this.agent.generate(input);
  }

  @Get(':id')
  getRun(@Param('id') id: string) {
    const run = this.runs.get(id);
    if (!run) throw new NotFoundException('未找到报告运行记录。');
    return run;
  }

  @Get('evaluation/cases')
  getEvaluationCases() {
    return reportEvaluationCases;
  }
}
