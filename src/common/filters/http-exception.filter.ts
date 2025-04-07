import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 * Provides consistent error response format across the application
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();
    
    // Get detailed error info (either string or object with message)
    const errorMessage = 
      typeof errorResponse === 'string' 
        ? errorResponse 
        : (errorResponse as any)?.message || 'Unknown error occurred';

    // Get error details if available (validation errors, etc.)
    const errorDetails = 
      typeof errorResponse === 'object' && (errorResponse as any)?.error
        ? (errorResponse as any)
        : null;

    // Log the error with request details
    this.logger.error(
      `${request.method} ${request.url} - Status ${status} - ${
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
      }`,
      errorDetails?.stack || exception.stack,
    );

    // Structure the error response consistently
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
      ...(errorDetails && { details: errorDetails }),
    });
  }
}
