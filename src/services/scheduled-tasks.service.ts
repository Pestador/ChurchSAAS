import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sermon } from '../entities/sermon.entity';
import { PrayerRequest } from '../entities/prayer-request.entity';
import { ContentModerationService } from './content-moderation.service';
import { ModerationService } from '../modules/moderation/moderation.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    @InjectRepository(Sermon)
    private sermonsRepository: Repository<Sermon>,
    @InjectRepository(PrayerRequest)
    private prayerRequestsRepository: Repository<PrayerRequest>,
    private contentModerationService: ContentModerationService,
    private moderationService: ModerationService,
  ) {}

  /**
   * Scan recent sermons for problematic content
   * Runs every 12 hours
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async scanRecentSermons() {
    this.logger.log('Starting automated scan of recent sermons');
    
    try {
      // Get sermons created/updated in the last 24 hours that haven't been scanned yet
      const recentSermons = await this.sermonsRepository
        .createQueryBuilder('sermon')
        .where('sermon.createdAt > :date OR sermon.updatedAt > :date', {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        })
        .andWhere('sermon.lastScannedAt IS NULL OR sermon.lastScannedAt < sermon.updatedAt')
        .getMany();
      
      this.logger.log(`Found ${recentSermons.length} recent sermons to scan`);
      
      // Process each sermon
      for (const sermon of recentSermons) {
        // Get the content to scan
        const contentToScan = sermon.content;
        
        // Skip if empty
        if (!contentToScan) {
          continue;
        }
        
        // Scan the content
        const moderationResult = await this.contentModerationService.scanContentForFlags(contentToScan);
        
        // If the content is flagged, create a flag record
        if (moderationResult.isFlagged) {
          this.logger.warn(`Flagged sermon ${sermon.id} with severity ${moderationResult.severity}`);
          
          await this.moderationService.flagContent(
            'sermon',
            sermon.id,
            contentToScan,
            sermon.churchId,
          );
        }
        
        // Update the sermon's lastScannedAt timestamp
        await this.sermonsRepository.update(sermon.id, {
          lastScannedAt: new Date(),
        });
      }
      
      this.logger.log('Completed automated scan of recent sermons');
    } catch (error) {
      this.logger.error(`Error scanning sermons: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Scan recent prayer requests for problematic content
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scanRecentPrayerRequests() {
    this.logger.log('Starting automated scan of recent prayer requests');
    
    try {
      // Get prayer requests created/updated in the last 24 hours that haven't been scanned yet
      const recentPrayerRequests = await this.prayerRequestsRepository
        .createQueryBuilder('prayer')
        .where('prayer.createdAt > :date OR prayer.updatedAt > :date', {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        })
        .andWhere('prayer.lastScannedAt IS NULL OR prayer.lastScannedAt < prayer.updatedAt')
        .getMany();
      
      this.logger.log(`Found ${recentPrayerRequests.length} recent prayer requests to scan`);
      
      // Process each prayer request
      for (const prayer of recentPrayerRequests) {
        // Get the content to scan
        const contentToScan = prayer.content;
        
        // Skip if empty
        if (!contentToScan) {
          continue;
        }
        
        // Scan the content
        const moderationResult = await this.contentModerationService.scanContentForFlags(contentToScan);
        
        // If the content is flagged, create a flag record
        if (moderationResult.isFlagged) {
          this.logger.warn(`Flagged prayer request ${prayer.id} with severity ${moderationResult.severity}`);
          
          await this.moderationService.flagContent(
            'prayer_request',
            prayer.id,
            contentToScan,
            prayer.churchId,
          );
        }
        
        // Update the prayer request's lastScannedAt timestamp
        await this.prayerRequestsRepository.update(prayer.id, {
          lastScannedAt: new Date(),
        });
      }
      
      this.logger.log('Completed automated scan of recent prayer requests');
    } catch (error) {
      this.logger.error(`Error scanning prayer requests: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Clean up old resolved flagged content
   * Runs once a week
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldResolvedFlags() {
    this.logger.log('Starting cleanup of old resolved flags');
    
    try {
      // Delete resolved flags older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const result = await this.moderationService.deleteOldResolvedFlags(ninetyDaysAgo);
      
      this.logger.log(`Deleted ${result.affected} old resolved flags`);
    } catch (error) {
      this.logger.error(`Error cleaning up old flags: ${error.message}`, error.stack);
    }
  }
}
