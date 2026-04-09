import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { Response } from 'express';

/**
 * Interceptor de respuesta estándar.
 * Envuelve TODAS las respuestas exitosas en el formato:
 * { success: true, data: ..., meta: { traceId } }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const reqTraceId = (request as any).traceId;
    const traceId = reqTraceId ? reqTraceId : 'unknown';

    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response && (response as any).statusCode ? (response as any).statusCode : 200;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        data: data ?? null,
        traceId,
      })),
    );
  }
}
