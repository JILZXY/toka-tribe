import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../../application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../config/constants/error-codes.js';

/**
 * Filtro global de excepciones.
 * Traduce TODA excepción a un formato de respuesta estándar.
 * OWASP A09: Nunca expone stack traces, datos internos ni mensajes de drivers.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request as any).traceId || 'unknown';

    let httpStatus: number;
    let code: string;
    let message: string;
    let details: Record<string, unknown> | undefined;

    if (exception instanceof AppException) {
      httpStatus = exception.httpStatus;
      code = exception.code;
      message = exception.userMessage;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        // Manejar errores de validación de class-validator
        if (Array.isArray(resp.message)) {
          code = ErrorCodes.VALIDATION_ERROR;
          message = 'Error de validación en los datos enviados.';
          details = { errors: resp.message };
        } else {
          code = ErrorCodes.VALIDATION_ERROR;
          message = typeof resp.message === 'string' ? resp.message : 'Error en la solicitud.';
        }
      } else {
        code = ErrorCodes.VALIDATION_ERROR;
        message = typeof exceptionResponse === 'string' ? exceptionResponse : 'Error en la solicitud.';
      }
    } else {
      // Error no controlado — OWASP: no exponer detalles
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ErrorCodes.INTERNAL_ERROR;
      message = 'Ha ocurrido un error interno. Intente de nuevo más tarde.';

      // Loggear el error real solo en el servidor
      this.logger.error(
        `Error no controlado en ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
        { traceId },
      );
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        traceId,
      },
    };

    response.status(httpStatus).json(errorResponse);
  }
}
