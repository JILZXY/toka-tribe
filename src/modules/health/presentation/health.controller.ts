import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, MongooseHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from '../indicators/redis.health.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Estado detallado de la aplicación y sus dependencias (DB, Cache)' })
  @ApiResponse({ status: 200, description: 'Todas las conexiones operativas.' })
  @ApiResponse({ status: 503, description: 'Alguna dependencia (Mongo o Redis) está caída.' })
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb', { timeout: 1500 }),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificar si la aplicación está lista para recibir tráfico' })
  @ApiResponse({ status: 200, description: 'La aplicación está lista.' })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Verificar si la aplicación está viva' })
  @ApiResponse({ status: 200, description: 'La aplicación está viva.' })
  live() {
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
    };
  }
}
