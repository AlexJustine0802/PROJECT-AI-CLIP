import { Controller, Get, Module, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../infra/prisma/prisma.service';

collectDefaultMetrics({ prefix: 'clipforge_api_' });

export const httpRequests = new Counter({
  name: 'clipforge_api_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});
export const httpDuration = new Histogram({
  name: 'clipforge_api_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
});

@ApiTags('ops')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'api', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('live')
  live() {
    return { status: 'alive' };
  }

  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', db: 'up' };
    } catch {
      return { status: 'degraded', db: 'down' };
    }
  }

  @Public()
  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
