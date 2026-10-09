import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateReportDto } from './dto/generate-report.dto';
import { reportTools, ReportToolsService } from './report-tools.service';
import { ReportRunStore } from './report-run.store';
import { ReportEvaluatorService } from './report-evaluator.service';

const instructions =
  '你是运营数据分析师。只能基于工具返回的数据下结论，不得编造数值或原因。报告必须有：执行摘要、核心指标、变化分析、风险与建议。每个关键数字注明比较口径和时间范围。数据不足时明确说明。使用简洁 Markdown。';

@Injectable()
export class ReportAgentService {
  private readonly openai: OpenAI | null;
  private readonly logger = new Logger(ReportAgentService.name);
  private readonly maxToolTurns: number;
  private readonly retryCount: number;

  constructor(
    config: ConfigService,
    private readonly tools: ReportToolsService,
    private readonly runs: ReportRunStore,
    private readonly evaluator: ReportEvaluatorService
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    const baseURL = config.get<string>('OPENAI_BASE_URL');
    this.openai = apiKey ? new OpenAI({ apiKey, baseURL }) : null;
    this.maxToolTurns = this.limit(config.get<number>('REPORT_MAX_TOOL_TURNS'), 6, 1, 8);
    this.retryCount = this.limit(config.get<number>('REPORT_MODEL_RETRY_COUNT'), 2, 0, 4);
  }

  async generate(input: GenerateReportDto) {
    if (!this.openai) throw new ServiceUnavailableException('服务端尚未配置 OPENAI_API_KEY。');
    const run = this.runs.create(input);
    this.log('report_started', { runId: run.id, period: input.period, scope: input.scope });
    const sources: Array<{ tool: string; summary: string }> = [];
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: instructions },
      {
        role: 'user',
        content: `请生成${input.period === 'week' ? '本周运营周报' : '本月运营月报'}，业务范围：${input.scope}。`,
      },
    ];
    const model = process.env.OPENAI_MODEL ?? 'Qwen/Qwen2.5-7B-Instruct';

    try {
      for (let turn = 0; turn < this.maxToolTurns; turn += 1) {
        const response = await this.createCompletion(run.id, model, messages);
        const message = response.choices[0]?.message;
        if (!message) throw new ServiceUnavailableException('模型没有返回可用结果。');
        messages.push(message);
        const calls = message.tool_calls ?? [];
        if (calls.length === 0) {
          const report = (message.content ?? '模型未生成报告内容。').slice(0, 12000);
          this.runs.complete(run.id);
          this.log('report_completed', {
            runId: run.id,
            toolCalls: sources.length,
            reportBytes: Buffer.byteLength(report),
          });
          return {
            id: run.id,
            modelResponseId: response.id,
            period: input.period,
            scope: input.scope,
            report,
            sources,
            evaluation: this.evaluator.evaluate(input, report, sources),
          };
        }
        const functionCalls = calls.filter(
          (call): call is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall => call.type === 'function'
        );
        if (functionCalls.length !== calls.length)
          throw new ServiceUnavailableException('模型返回了不支持的自定义工具调用。');
        const toolOutputs: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = await Promise.all(
          functionCalls.map(async (call) => {
            const startedAt = performance.now();
            const result = await this.tools.execute(call.function.name, call.function.arguments);
            const output = JSON.stringify(result);
            const durationMs = Math.round(performance.now() - startedAt);
            this.runs.recordTool(run.id, call.function.name, durationMs, Buffer.byteLength(output));
            this.log('tool_completed', {
              runId: run.id,
              tool: call.function.name,
              durationMs,
              resultBytes: Buffer.byteLength(output),
            });
            sources.push({ tool: call.function.name, summary: output.slice(0, 2000) });
            return { role: 'tool' as const, tool_call_id: call.id, content: output };
          })
        );
        messages.push(...toolOutputs);
      }
      throw new ServiceUnavailableException('模型连续调用工具超过最大轮数，报告未生成。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      this.runs.fail(run.id, message);
      this.logger.error(JSON.stringify({ event: 'report_failed', runId: run.id, error: message }));
      throw error;
    }
  }

  private async createCompletion(
    runId: string,
    model: string,
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ) {
    for (let attempt = 0; attempt <= this.retryCount; attempt += 1) {
      this.runs.recordAttempt(runId);
      try {
        return await this.openai!.chat.completions.create({
          model,
          messages,
          tools: reportTools,
          tool_choice: 'auto',
          parallel_tool_calls: false,
          temperature: 0.2,
        });
      } catch (error) {
        if (!this.isRetryable(error) || attempt === this.retryCount) throw error;
        const delayMs = 300 * 2 ** attempt;
        this.logger.warn(
          JSON.stringify({
            event: 'model_retry',
            runId,
            attempt: attempt + 1,
            delayMs,
            status: this.errorStatus(error),
          })
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw new ServiceUnavailableException('模型调用重试已耗尽。');
  }

  private isRetryable(error: unknown) {
    const status = this.errorStatus(error);
    return status === 408 || status === 409 || status === 429 || (status !== undefined && status >= 500);
  }

  private errorStatus(error: unknown) {
    return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
      ? error.status
      : undefined;
  }

  private limit(value: number | undefined, fallback: number, min: number, max: number) {
    return Math.min(Math.max(value ?? fallback, min), max);
  }

  private log(event: string, fields: Record<string, string | number>) {
    this.logger.log(JSON.stringify({ event, ...fields }));
  }
}
