// src/app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// ── Feature modules ───────────────────────────────────────────────────────────
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

// ── Infrastructure modules ────────────────────────────────────────────────────
import { CustomCacheModule } from './common/cache/cache.module';
import { ConfigModule } from './config/config.module';
import { MetricsModule } from './metrics/metrics.module';
import { RateLimitModule } from './ratelimit/ratelimit.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { MetricsTypeOrmLogger } from './metrics/typeorm-logger';
import { MetricsService } from './metrics/metrics.service';
import { MetricsTypeOrmLogger } from './metrics/typeorm-logger';
import { ErrorLoggerService } from './common/logging/error-logger.service';

// ── Filters / interceptors ────────────────────────────────────────────────────
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AdvancedCacheInterceptor } from './common/interceptors/advanced-cache.interceptor';
import { MetricsInterceptor } from './metrics/metrics.interceptor';

@Module({
  imports: [
    // ── Config (must be first — many factories depend on it) ────────────────
    ConfigModule,

    // ── Observability ────────────────────────────────────────────────────────
    MetricsModule,

    // ── Database ─────────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, MetricsModule],
      useFactory: (
        configService: ConfigService,
        metricsService: MetricsService,
      ) => ({
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
        maxQueryExecutionTime: parseInt(
          process.env.DB_SLOW_QUERY_MS ?? '200',
          10,
        ),
        logger: new MetricsTypeOrmLogger(metricsService),
      }),
      inject: [ConfigService, MetricsService],
    }),

    // ── Scheduling (registered once) ─────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Event bus (required by BiddingGateway + AuctionTimerService) ─────────
    EventEmitterModule.forRoot({
      // Allow wildcard listeners e.g. 'auction.*' — set false if not needed
      wildcard: false,
      // Max listeners per event (raise if you add more @OnEvent handlers)
      maxListeners: 20,
      // Catch listener errors so one bad handler doesn't crash the bus
      ignoreErrors: false,
    }),

    // ── Redis / Bull ──────────────────────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.redis.host,
          port: configService.redis.port,
          password: configService.redis.password || undefined,
          db: configService.redis.db,
        },
        // Shared Bull defaults — individual queues can override per-queue
        defaultJobOptions: {
          removeOnComplete: false, // keep completed jobs for audit
          removeOnFail: false,     // keep failed jobs for inspection
          attempts: 3,
          backoff: { type: 'exponential', delay: 500 },
        },
      }),
      inject: [ConfigService],
    }),

    // ── Cache ─────────────────────────────────────────────────────────────────
    CustomCacheModule,

    // ── Background job queues ─────────────────────────────────────────────────
    QueueModule,

    // ── Feature modules ───────────────────────────────────────────────────────
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

    // Global exception handler
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Cache-aware HTTP response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: AdvancedCacheInterceptor,
    },

    // Request / response metrics
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}