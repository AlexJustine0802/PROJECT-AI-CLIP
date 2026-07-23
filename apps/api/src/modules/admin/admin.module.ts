import { Controller, Get, Injectable, Module, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/roles.guard';
import { FeatureFlagGuard, FeatureFlagsService, RequireFlag } from '../../common/feature-flags';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [users, teams, videos, clips, jobs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.team.count(),
      this.prisma.video.count(),
      this.prisma.clip.count(),
      this.prisma.job.count({ where: { status: 'RUNNING' } }),
    ]);
    return { users, teams, videos, clips, activeJobs: jobs };
  }

  async revenue() {
    const invoices = await this.prisma.invoice.aggregate({ _sum: { amountPaid: true } });
    const subs = await this.prisma.subscription.groupBy({ by: ['status'], _count: true });
    return { totalPaidCents: invoices._sum.amountPaid ?? 0, subscriptions: subs };
  }

  systemHealth() {
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      timestamp: new Date().toISOString(),
    };
  }

  async aiUsage() {
    const agg = await this.prisma.usageRecord.aggregate({
      _sum: {
        minutesProcessed: true,
        wordsTranscribed: true,
        clipsGenerated: true,
        estimatedCostUsd: true,
        gpuSeconds: true,
      },
    });
    return agg._sum;
  }

  recentLogs(limit: number) {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }
}

@ApiTags('admin')
@UseGuards(FeatureFlagGuard, RolesGuard)
@RequireFlag('enableAdmin')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  @Roles('admin')
  overview() {
    return this.admin.overview();
  }

  @Get('revenue')
  @Roles('admin')
  revenue() {
    return this.admin.revenue();
  }

  @Get('ai-usage')
  @Roles('admin')
  aiUsage() {
    return this.admin.aiUsage();
  }

  @Get('system-health')
  @Roles('admin')
  systemHealth() {
    return this.admin.systemHealth();
  }

  @Get('logs')
  @Roles('admin')
  logs(@Query('limit') limit = '50') {
    return this.admin.recentLogs(parseInt(limit, 10));
  }
}

@Module({
  providers: [AdminService, FeatureFlagsService],
  controllers: [AdminController],
})
export class AdminModule {}
