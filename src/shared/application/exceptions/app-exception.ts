import { HttpStatus } from '@nestjs/common';
import { type ErrorCode } from '../../../config/constants/error-codes.js';

/**
 * Excepción base de la aplicación.
 * Encapsula código de error, mensaje legible, HTTP status y detalles sanitizados.
 * OWASP A09: Nunca incluir stack traces, queries ni tokens en los detalles.
 */
export class AppException extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly userMessage: string,
    public readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, unknown>,
  ) {
    super(userMessage);
    this.name = 'AppException';
  }

  /**
   * Crea una excepción de recurso no encontrado.
   */
  static notFound(code: ErrorCode, message: string, details?: Record<string, unknown>): AppException {
    return new AppException(code, message, HttpStatus.NOT_FOUND, details);
  }

  /**
   * Crea una excepción de conflicto (duplicados / idempotencia).
   */
  static conflict(code: ErrorCode, message: string, details?: Record<string, unknown>): AppException {
    return new AppException(code, message, HttpStatus.CONFLICT, details);
  }

  /**
   * Crea una excepción de no autorizado.
   */
  static unauthorized(code: ErrorCode, message: string): AppException {
    return new AppException(code, message, HttpStatus.UNAUTHORIZED);
  }

  /**
   * Crea una excepción de prohibido.
   */
  static forbidden(code: ErrorCode, message: string): AppException {
    return new AppException(code, message, HttpStatus.FORBIDDEN);
  }
}
