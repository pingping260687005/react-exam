import { Injectable } from '@nestjs/common';

export type MetricSnapshot = {
  period: string;
  scope: string;
  gmv: number;
  paidOrders: number;
  newUsers: number;
  refundRate: number;
};

@Injectable()
export class MetricsService {
  async getSnapshot(period: string, scope: string): Promise<MetricSnapshot> {
    // Replace this deterministic demo adapter with ORM aggregate queries.
    return { period, scope, gmv: 1286400, paidOrders: 18420, newUsers: 3260, refundRate: 1.82 };
  }

  async comparePeriods(period: string, scope: string) {
    return {
      period,
      scope,
      gmvChangeRate: 12.4,
      paidOrderChangeRate: 8.1,
      newUserChangeRate: -3.6,
      refundRateChange: 0.28,
    };
  }

  async getBreakdown(dimension: 'channel' | 'region', scope: string) {
    const values =
      dimension === 'channel'
        ? [
            { name: 'App', gmv: 627000, changeRate: 18.2 },
            { name: '小程序', gmv: 421000, changeRate: 6.4 },
            { name: 'Web', gmv: 238400, changeRate: -4.2 },
          ]
        : [
            { name: '华东', gmv: 520000, changeRate: 15.1 },
            { name: '华南', gmv: 399000, changeRate: 10.3 },
            { name: '华北', gmv: 367400, changeRate: 3.2 },
          ];
    return { dimension, scope, values };
  }
}
