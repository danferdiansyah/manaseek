import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  check() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe including database and cache' })
  async ready() {
    const [database, cache] = await Promise.all([this.pingDatabase(), this.redis.ping()]);
    const status = database && cache ? 'ok' : 'degraded';

    return {
      status,
      dependencies: { database, cache },
      timestamp: new Date().toISOString(),
    };
  }

  private async pingDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
