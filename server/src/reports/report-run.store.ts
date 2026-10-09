import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GenerateReportDto } from './dto/generate-report.dto';

export type ReportRunStatus = 'running' | 'completed' | 'failed';

export type ReportRun = {
  id: string;
  status: ReportRunStatus;
  input: GenerateReportDto;
  modelAttempts: number;
  tools: Array<{ name: string; durationMs: number; resultBytes: number }>;
  startedAt: string;
  finishedAt?: string;
  error?: string;
};

@Injectable()
export class ReportRunStore {
  private readonly runs = new Map<string, ReportRun>();

  create(input: GenerateReportDto) {
    const run: ReportRun = {
      id: randomUUID(),
      status: 'running',
      input,
      modelAttempts: 0,
      tools: [],
      startedAt: new Date().toISOString(),
    };
    this.runs.set(run.id, run);
    return run;
  }

  recordAttempt(id: string) {
    this.requireRun(id).modelAttempts += 1;
  }

  recordTool(id: string, name: string, durationMs: number, resultBytes: number) {
    this.requireRun(id).tools.push({ name, durationMs, resultBytes });
  }

  complete(id: string) {
    const run = this.requireRun(id);
    run.status = 'completed';
    run.finishedAt = new Date().toISOString();
  }

  fail(id: string, error: string) {
    const run = this.requireRun(id);
    run.status = 'failed';
    run.error = error;
    run.finishedAt = new Date().toISOString();
  }

  get(id: string) {
    return this.runs.get(id);
  }

  private requireRun(id: string) {
    const run = this.runs.get(id);
    if (!run) throw new Error(`运行记录不存在：${id}`);
    return run;
  }
}
