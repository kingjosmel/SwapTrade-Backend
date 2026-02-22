// src/app.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { TradingModule } from './trading/trading.module';
import { UserModule } from './user/user.module';
import { RewardsModule } from './rewards/rewards.module';
import { NotificationModule } from './notification/notification.module';
import { BiddingModule } from './bidding/bidding.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { BalanceModule } from './balance/balance.module';
import { SwapModule } from './swap/swap.module';
import { TutorialModule } from './tutorial/tutorial.module';
import { PerformanceModule } from './performance/performance.module';
import { QueueModule } from './queue/queue.module';
import { CustomCacheModule } from './common/cache/cache.module';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ErrorLoggerService } from './common/logging/error-logger.service';
import { AdvancedCacheInterceptor } from './common/interceptors/advanced-cache.interceptor';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { MetricsModule } from './metrics/metrics.module';
import { RateLimitModule } from './ratelimit/ratelimit.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { MetricsTypeOrmLogger } from './metrics/typeorm-logger';
import { MetricsService } from './metrics/metrics.service';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Metrics
    MetricsModule,

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, MetricsModule],
      useFactory: (configService: ConfigService, metricsService: MetricsService) => ({
        type: configService.database.type as any,
        host: configService.database.host,
        port: configService.database.port,
        username: configService.database.username,
        password: configService.database.password,
        database: configService.database.database,
        autoLoadEntities: configService.database.autoLoadEntities,
        synchronize: configService.database.synchronize,
        migrations: configService.database.migrations,
        migrationsTableName: configService.database.migrationsTableName,
        logging: ['query', 'error', 'warn'],
        maxQueryExecutionTime: parseInt(process.env.DB_SLOW_QUERY_MS || '200', 10),
        logger: new MetricsTypeOrmLogger(metricsService),
      }),
      inject: [ConfigService, MetricsService],
    }),

    // Scheduling for cron jobs
    ScheduleModule.forRoot(),

    // Scheduling for cron jobs
    ScheduleModule.forRoot(),

    // Cache Module
    CustomCacheModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.redis.host,
          port: configService.redis.port,
          password: configService.redis.password || undefined,
          db: configService.redis.db,
        },
      }),
      inject: [ConfigService],
    }),

    // Background Job Queue (NEW) - Temporarily disabled due to compilation issue
    // QueueModule,

    // Existing modules
    AuthModule,
    // Distributed rate limiting
    RateLimitModule,
    PortfolioModule,
    TradingModule,
    UserModule,
    RewardsModule,
    NotificationModule,
    BiddingModule,
    CommonModule,
    DatabaseModule,
    BalanceModule,
    SwapModule,
    TutorialModule,
    PerformanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ErrorLoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AdvancedCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
