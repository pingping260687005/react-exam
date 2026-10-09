import { IsIn } from 'class-validator';

export class GenerateReportDto {
  @IsIn(['week', 'month'])
  period!: 'week' | 'month';

  @IsIn(['全站', '华东区域', 'App 渠道'])
  scope!: string;
}
