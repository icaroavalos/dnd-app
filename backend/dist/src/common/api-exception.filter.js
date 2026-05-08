var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApiExceptionFilter_1;
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
let ApiExceptionFilter = ApiExceptionFilter_1 = class ApiExceptionFilter {
    logger = new Logger(ApiExceptionFilter_1.name);
    catch(exception, host) {
        const context = host.switchToHttp();
        const request = context.getRequest();
        const response = context.getResponse();
        const normalized = normalizeException(exception);
        if (normalized.statusCode >= 500) {
            this.logger.error(normalized.message, exception instanceof Error ? exception.stack : undefined);
        }
        const payload = {
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
};
ApiExceptionFilter = ApiExceptionFilter_1 = __decorate([
    Catch()
], ApiExceptionFilter);
export { ApiExceptionFilter };
function normalizeException(exception) {
    if (exception instanceof HttpException) {
        const statusCode = exception.getStatus();
        const response = exception.getResponse();
        const responseObject = typeof response === 'string'
            ? { message: response }
            : response;
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
function normalizeCode(value, statusCode) {
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
function normalizeMessage(value, fallback) {
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
//# sourceMappingURL=api-exception.filter.js.map