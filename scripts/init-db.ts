import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const logger = new Logger('Database Initialization');
  
  try {
    logger.log('Starting database initialization...');
    
    // Create a standalone application context
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the TypeORM DataSource
    const dataSource = app.get<DataSource>(getDataSourceToken());
    
    // Check connection
    if (dataSource.isInitialized) {
      logger.log('Database connection established');
      
      // Get the current database schema state
      const entities = dataSource.entityMetadatas;
      logger.log(`Found ${entities.length} entities to synchronize`);
      
      for (const entity of entities) {
        logger.log(`Entity: ${entity.name} (${entity.tableName})`);
      }
      
      // Synchronize database schema if not already done by TypeORM
      if (!dataSource.options.synchronize) {
        logger.log('Manually synchronizing database schema...');
        await dataSource.synchronize();
        logger.log('Database schema synchronized successfully');
      } else {
        logger.log('Database schema automatically synchronized by TypeORM');
      }
      
      // Create indices and optimizations if needed
      logger.log('Database initialization completed successfully');
    } else {
      logger.error('Failed to connect to the database');
    }
    
    // Gracefully shutdown
    await app.close();
    logger.log('Application context closed');
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap();
