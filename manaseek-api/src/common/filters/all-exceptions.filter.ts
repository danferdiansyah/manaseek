import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ErrorCode } from '../errors/app-error';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Single place that shapes every error response. Contract:
 * { error: { code, message, details? }, path, timestamp, requestId }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.normalize(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${body.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      error: body,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: (request as Request & { id?: string }).id,
    });
  }

  private normalize(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null && 'code' in payload) {
        const typed = payload as ErrorBody;
        return {
          status,
          body: { code: typed.code, message: typed.message, details: typed.details },
        };
      }

      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ?? exception.message);

      return {
        status,
        body: {
          code: this.codeForStatus(status),
          message: Array.isArray(message) ? message.join(', ') : message,
        },
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrisma(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal server error' },
    };
  }

  private normalizePrisma(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    body: ErrorBody;
  } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          body: {
            code: ErrorCode.CONFLICT,
            message: 'A record with these values already exists',
            details: error.meta?.target,
          },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: { code: ErrorCode.NOT_FOUND, message: 'Record not found' },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: { code: ErrorCode.INTERNAL_ERROR, message: 'Database error' },
        };
    }
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
