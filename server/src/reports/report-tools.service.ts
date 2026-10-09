import { BadRequestException, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MetricsService } from './metrics.service';

const snapshotSchema = z.object({ period: z.enum(['week', 'month']), scope: z.string().min(1).max(100) });
const breakdownSchema = snapshotSchema.extend({ dimension: z.enum(['channel', 'region']) });

export const reportTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_metric_snapshot',
      description: '获取指定周期和业务范围的核心运营指标。',
      parameters: {
        type: 'object',
        properties: { period: { type: 'string', enum: ['week', 'month'] }, scope: { type: 'string' } },
        required: ['period', 'scope'],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compare_metric_periods',
      description: '获取指定周期相对上一相同周期的核心指标变化。',
      parameters: {
        type: 'object',
        properties: { period: { type: 'string', enum: ['week', 'month'] }, scope: { type: 'string' } },
        required: ['period', 'scope'],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_metric_breakdown',
      description: '按渠道或区域获取 GMV 分布和变化，用于定位增长或下降来源。',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['week', 'month'] },
          scope: { type: 'string' },
          dimension: { type: 'string', enum: ['channel', 'region'] },
        },
        required: ['period', 'scope', 'dimension'],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

@Injectable()
export class ReportToolsService {
  constructor(private readonly metrics: MetricsService) {}

  async execute(name: string, argumentsJson: string) {
    const input = this.parseArguments(argumentsJson);
    if (name === 'get_metric_snapshot') {
      const value = snapshotSchema.parse(input);
      return this.metrics.getSnapshot(value.period, value.scope);
    }
    if (name === 'compare_metric_periods') {
      const value = snapshotSchema.parse(input);
      return this.metrics.comparePeriods(value.period, value.scope);
    }
    if (name === 'get_metric_breakdown') {
      const value = breakdownSchema.parse(input);
      return this.metrics.getBreakdown(value.dimension, value.scope);
    }
    throw new BadRequestException(`未知工具：${name}`);
  }

  private parseArguments(argumentsJson: string): unknown {
    try {
      return JSON.parse(argumentsJson);
    } catch {
      throw new BadRequestException('工具参数不是合法 JSON。');
    }
  }
}
