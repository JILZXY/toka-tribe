import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cacheManager.set('ping', 'pong', 1000);
      const val = await this.cacheManager.get('ping');
      const isOk = val === 'pong';
      if (!isOk) throw new Error('Redis did not return correct value');
      return this.getStatus(key, true);
    } catch (error: any) {
      throw new HealthCheckError(
        'Redis cache check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
