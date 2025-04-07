import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global All Exceptions Filter
 * Catches any unhandled exceptions and provides a consistent error response
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Default to internal server error for unhandled exceptions
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Get error message or default
    const errorMessage = exception.message || 'Internal server error';

    // Log the error with detailed information
    this.logger.error(
      `Unhandled exception: ${request.method} ${request.url} - ${errorMessage}`,
      exception.stack,
    );

    // Return a consistent error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'An unexpected error occurred',
      // Don't expose detailed error messages to client in production
      ...(process.env.NODE_ENV !== 'production' && { 
        devError: errorMessage,
        stack: exception.stack 
      }),
    });
  }
}
