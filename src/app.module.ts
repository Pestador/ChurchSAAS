import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ChurchesModule } from './modules/churches/churches.module';
import { SermonsModule } from './modules/sermons/sermons.module';
import { AuthModule } from './modules/auth/auth.module';
import { BibleStudyModule } from './modules/bible-study/bible-study.module';
import { PrayerRequestsModule } from './modules/prayer-requests/prayer-requests.module';
import { ModerationModule } from './modules/moderation/moderation.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Database configuration - conditionally loaded based on environment variable
    ...(process.env.SKIP_DB_CONNECTION === 'true' 
      ? [] 
      : [TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'password'),
            database: configService.get('DB_DATABASE', 'church_saas'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
            logging: configService.get<string>('NODE_ENV') === 'development',
          }),
        })
      ]
    ),
    
    // Application modules
    UsersModule,
    ChurchesModule,
    SermonsModule,
    AuthModule,
    BibleStudyModule,
    PrayerRequestsModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
