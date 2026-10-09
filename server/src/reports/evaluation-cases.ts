export const reportEvaluationCases = [
  {
    id: 'weekly-all-site',
    input: { period: 'week', scope: '全站' },
    expectedTools: ['get_metric_snapshot', 'compare_metric_periods'],
    requiredSections: ['执行摘要', '核心指标', '变化分析', '风险与建议'],
  },
  {
    id: 'monthly-app-channel',
    input: { period: 'month', scope: 'App 渠道' },
    expectedTools: ['get_metric_snapshot', 'get_metric_breakdown'],
    requiredSections: ['执行摘要', '核心指标', '变化分析', '风险与建议'],
  },
] as const;
