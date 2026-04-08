import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

/**
 * Interceptor de respuesta estándar.
 * Envuelve TODAS las respuestas exitosas en el formato:
 * { success: true, data: ..., meta: { traceId } }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const traceId = (request as any).traceId || 'unknown';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data ?? null,
        meta: {
          traceId,
        },
      })),
    );
  }
}
