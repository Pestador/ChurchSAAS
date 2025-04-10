import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { FlaggedContent } from '../../entities/flagged-content.entity';
import { ContentModerationService } from '../../services/content-moderation.service';
import { OpenAIService } from '../../services/openai.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationService } from '../../services/notification.service';
import { ScheduledTasksService } from '../../services/scheduled-tasks.service';
import { Sermon } from '../../entities/sermon.entity';
import { PrayerRequest } from '../../entities/prayer-request.entity';
import { User } from '../../entities/user.entity';
import { Church } from '../../entities/church.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlaggedContent, Sermon, PrayerRequest, User, Church]),
    AuthModule
  ],
  controllers: [ModerationController],
  providers: [
    ModerationService, 
    ContentModerationService, 
    OpenAIService,
    NotificationService,
    ScheduledTasksService
  ],
  exports: [ModerationService, ContentModerationService],
})
export class ModerationModule {}
