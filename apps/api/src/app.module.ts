import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'node:path';

import { configuration } from './config/configuration';
import { PrismaModule } from './infra/prisma/prisma.module';
import { CacheModule } from './infra/cache/cache.module';
import { StorageModule } from './infra/storage/storage.module';
import { QueueModule } from './queue/queue.module';

import { JwtAuthGuard } from './common/jwt-auth.guard';
import { RolesGuard } from './common/roles.guard';
import { FeatureFlagsService } from './common/feature-flags';

import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { VideosModule } from './modules/videos/videos.module';
import { ClipsModule } from './modules/clips/clips.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { GraphqlFeatureModule } from './modules/graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], cache: true }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX ?? '120', 10),
      },
    ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),

    // Infrastructure
    PrismaModule,
    CacheModule,
    StorageModule,
    QueueModule,

    // Features
    AuthModule,
    ProjectsModule,
    VideosModule,
    ClipsModule,
    JobsModule,
    BillingModule,
    AdminModule,
    HealthModule,
    GraphqlFeatureModule,
  ],
  providers: [
    FeatureFlagsService,
    // Global auth → RBAC → rate-limit chain. @Public() opts routes out of auth.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
