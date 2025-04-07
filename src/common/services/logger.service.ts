import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Application Logger Service
 * Provides structured logging with file output support
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private static logStream: NodeJS.WritableStream;

  constructor() {
    // Initialize log directory and stream if not already done
    if (!LoggerService.logStream) {
      this.initializeLogStream();
    }
  }

  /**
   * Set the context for this logger instance
   */
  setContext(context: string) {
    this.context = context;
    return this;
  }

  /**
   * Log an informational message
   */
  log(message: any, ...optionalParams: any[]) {
    this.writeLog('INFO', message, ...optionalParams);
    console.log(this.formatMessage('INFO', message), ...optionalParams);
  }

  /**
   * Log an error message
   */
  error(message: any, ...optionalParams: any[]) {
    this.writeLog('ERROR', message, ...optionalParams);
    console.error(this.formatMessage('ERROR', message), ...optionalParams);
  }

  /**
   * Log a warning message
   */
  warn(message: any, ...optionalParams: any[]) {
    this.writeLog('WARN', message, ...optionalParams);
    console.warn(this.formatMessage('WARN', message), ...optionalParams);
  }

  /**
   * Log a debug message
   */
  debug(message: any, ...optionalParams: any[]) {
    // Only log debug in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      this.writeLog('DEBUG', message, ...optionalParams);
      console.debug(this.formatMessage('DEBUG', message), ...optionalParams);
    }
  }

  /**
   * Log a verbose message
   */
  verbose(message: any, ...optionalParams: any[]) {
    // Only log verbose in development environment
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('VERBOSE', message, ...optionalParams);
      console.log(this.formatMessage('VERBOSE', message), ...optionalParams);
    }
  }

  /**
   * Format message with timestamp, level, and context
   */
  private formatMessage(level: string, message: any): string {
    const timestamp = new Date().toISOString();
    const formattedMessage = typeof message === 'object' ? 
      JSON.stringify(message) : message;
    
    return `[${timestamp}] [${level}] ${this.context ? `[${this.context}] ` : ''}${formattedMessage}`;
  }

  /**
   * Write log to file
   */
  private writeLog(level: string, message: any, ...optionalParams: any[]) {
    if (LoggerService.logStream) {
      const logMessage = this.formatMessage(level, message);
      LoggerService.logStream.write(logMessage + '\n');
      
      // Log additional params if any
      if (optionalParams.length > 0) {
        optionalParams.forEach(param => {
          if (param && typeof param === 'object') {
            // Handle Error objects specially
            if (param instanceof Error) {
              LoggerService.logStream.write(
                `${this.formatMessage(level, 'Error Stack:')} ${param.stack}\n`
              );
            } else {
              LoggerService.logStream.write(
                `${this.formatMessage(level, 'Additional Data:')} ${JSON.stringify(param)}\n`
              );
            }
          }
        });
      }
    }
  }

  /**
   * Initialize log directory and file stream
   */
  private initializeLogStream() {
    try {
      // Create logs directory if it doesn't exist
      const logsDir = join(process.cwd(), 'logs');
      if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
      }

      // Create a log file for current date
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = join(logsDir, `app-${date}.log`);
      
      // Create or append to log file
      LoggerService.logStream = createWriteStream(logFile, { flags: 'a' });
      
      console.log(`Logging to file: ${logFile}`);
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }
}
