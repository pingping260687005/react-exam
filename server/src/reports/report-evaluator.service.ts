import { Injectable } from '@nestjs/common';
import { GenerateReportDto } from './dto/generate-report.dto';
import { reportEvaluationCases } from './evaluation-cases';

@Injectable()
export class ReportEvaluatorService {
  evaluate(input: GenerateReportDto, report: string, sources: Array<{ tool: string }>) {
    const evaluationCase = reportEvaluationCases.find(
      (candidate) => candidate.input.period === input.period && candidate.input.scope === input.scope
    );
    if (!evaluationCase) return null;
    const calledTools = new Set(sources.map((source) => source.tool));
    const missingTools = evaluationCase.expectedTools.filter((tool) => !calledTools.has(tool));
    const missingSections = evaluationCase.requiredSections.filter((section) => !report.includes(section));
    return {
      caseId: evaluationCase.id,
      passed: missingTools.length === 0 && missingSections.length === 0,
      missingTools,
      missingSections,
    };
  }
}
