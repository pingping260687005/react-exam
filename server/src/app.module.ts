import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportsModule } from './reports/reports.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), ReportsModule] })
export class AppModule {}
