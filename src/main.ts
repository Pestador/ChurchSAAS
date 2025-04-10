import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';
import { LoggerService } from './common/services/logger.service';
import { join } from 'path';

async function bootstrap() {
  // Load environment variables
  dotenv.config();
  
  // Create custom logger instance
  const logger = new LoggerService().setContext('Bootstrap');
  
  // Create application with custom logger
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // Buffer logs until logger is resolved
  });
  
  // Set up application
  configureApp(app, logger);
  
  // Get port from environment variables or use default
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

/**
 * Configure the NestJS application with middleware, filters, etc.
 */
function configureApp(app: NestExpressApplication, logger: LoggerService) {
  // Use custom logger for application
  app.useLogger(logger);
  
  // Global exception filters (order matters - specific first, then general)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionsFilter(),
  );
  
  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  
  // Enable validation pipes for DTOs (using built-in or custom)
  const useCustomValidation = process.env.USE_CUSTOM_VALIDATION === 'true';
  
  if (useCustomValidation) {
    app.useGlobalPipes(new CustomValidationPipe());
    logger.log('Using custom validation pipe');
  } else {
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
      transformOptions: {
        enableImplicitConversion: true, // Convert primitives automatically
      },
    }));
    logger.log('Using built-in validation pipe');
  }
  
  // Enable CORS
  app.enableCors();
  
  // Serve static files from the public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));
  logger.log('Serving static assets from public directory');
  
  // Global prefix for all routes (optional)
  // app.setGlobalPrefix('api');
  
  logger.log('Application configured successfully');
}

bootstrap();
