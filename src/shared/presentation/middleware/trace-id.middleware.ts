import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware que genera un traceId único por solicitud.
 * Se adjunta al request para correlación en logs y respuestas de error.
 * OWASP A09: Facilita la trazabilidad sin exponer datos sensibles.
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    (req as any).traceId =
      (req.headers['x-trace-id'] as string) || `req-${randomUUID().substring(0, 8)}`;
    next();
  }
}
