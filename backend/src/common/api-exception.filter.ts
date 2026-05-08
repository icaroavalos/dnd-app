import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

interface ApiErrorPayload {
  statusCode: number;
  error: {
    code: string;
    message: string;
  };
  path: string;
  requestId: string;
  timestamp: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const response = context.getResponse<FastifyReply>();
    const normalized = normalizeException(exception);

    if (normalized.statusCode >= 500) {
      this.logger.error(normalized.message, exception instanceof Error ? exception.stack : undefined);
    }

    const payload: ApiErrorPayload = {
      statusCode: normalized.statusCode,
      error: {
        code: normalized.code,
        message: normalized.message
      },
      path: request.url,
      requestId: String(request.id ?? ''),
      timestamp: new Date().toISOString()
    };

    response.status(normalized.statusCode).send(payload);
  }
}

function normalizeException(exception: unknown): {
  statusCode: number;
  code: string;
  message: string;
} {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const responseObject =
      typeof response === 'string'
        ? { message: response }
        : (response as Record<string, unknown>);

    const code = normalizeCode(responseObject.code, statusCode);
    const message = normalizeMessage(responseObject.message, exception.message);

    return { statusCode, code, message };
  }

  if (exception instanceof Error) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: exception.message || 'Unexpected internal server error.'
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected internal server error.'
  };
}

function normalizeCode(value: unknown, statusCode: number): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'HTTP_ERROR';
  }
}

function normalizeMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === 'string' && entry.trim());
    if (first) {
      return String(first).trim();
    }
  }

  return fallback || 'Request failed.';
}
