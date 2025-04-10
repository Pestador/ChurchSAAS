import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlaggedContent } from '../../entities/flagged-content.entity';
import { ContentModerationService, ContentFlagSeverity } from '../../services/content-moderation.service';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @InjectRepository(FlaggedContent)
    private readonly flaggedContentRepository: Repository<FlaggedContent>,
    private readonly contentModerationService: ContentModerationService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Flag content for moderation review
   */
  async flagContent(
    contentType: string,
    contentId: string,
    content: string,
    churchId: string,
  ): Promise<FlaggedContent> {
    this.logger.debug(`Flagging content: ${contentType} with ID ${contentId}`);

    // First, moderate the content
    const moderationResult = await this.contentModerationService.scanContentForFlags(content);

    // Create a snippet - limit to 200 characters to avoid storing huge amounts of content
    const snippet = content.length > 200 ? content.substring(0, 197) + '...' : content;

    // Create and save the flagged content record
    const flaggedContent = this.flaggedContentRepository.create({
      contentType,
      contentId,
      snippet,
      churchId,
      isFlagged: moderationResult.isFlagged,
      severity: moderationResult.severity,
      categories: moderationResult.categories,
      reasons: moderationResult.reasons,
      moderationScore: moderationResult.moderationScore,
    });

    const savedFlag = await this.flaggedContentRepository.save(flaggedContent);

    // Send notification for high severity flags
    if (moderationResult.severity === ContentFlagSeverity.HIGH) {
      await this.notifyHighSeverityFlag(savedFlag);
    }

    return savedFlag;
  }

  /**
   * Check content before submission and return the moderation result
   * Can be used to block content from being saved
   */
  async checkContent(content: string): Promise<boolean> {
    return this.contentModerationService.preSubmissionFilter(content);
  }

  /**
   * Get all flagged content for a church, with filtering options
   */
  async getFlaggedContent(
    churchId: string,
    resolved?: boolean,
    severity?: ContentFlagSeverity,
    contentType?: string,
  ): Promise<FlaggedContent[]> {
    let query = this.flaggedContentRepository
      .createQueryBuilder('flagged')
      .where('flagged.churchId = :churchId', { churchId });

    if (resolved !== undefined) {
      query = query.andWhere('flagged.resolved = :resolved', { resolved });
    }

    if (severity) {
      query = query.andWhere('flagged.severity = :severity', { severity });
    }

    if (contentType) {
      query = query.andWhere('flagged.contentType = :contentType', { contentType });
    }

    // Order by severity (high to low) and then by flagged date (newest first)
    query = query
      .orderBy('CASE ' +
        `WHEN flagged.severity = '${ContentFlagSeverity.HIGH}' THEN 1 ` +
        `WHEN flagged.severity = '${ContentFlagSeverity.MEDIUM}' THEN 2 ` + 
        `WHEN flagged.severity = '${ContentFlagSeverity.LOW}' THEN 3 ` +
        `ELSE 4 END`)
      .addOrderBy('flagged.flaggedAt', 'DESC');

    return query.getMany();
  }

  /**
   * Get a specific flagged content item by ID
   */
  async getFlaggedContentById(id: string, churchId: string): Promise<FlaggedContent> {
    const flaggedContent = await this.flaggedContentRepository.findOne({
      where: { id, churchId },
    });

    if (!flaggedContent) {
      throw new NotFoundException(`Flagged content with ID ${id} not found`);
    }

    return flaggedContent;
  }

  /**
   * Review flagged content
   */
  async reviewFlaggedContent(
    id: string,
    reviewedById: string,
    reviewNotes: string,
    resolved: boolean,
    churchId: string,
  ): Promise<FlaggedContent> {
    const flaggedContent = await this.getFlaggedContentById(id, churchId);

    // Update the flagged content with review information
    flaggedContent.reviewedById = reviewedById;
    flaggedContent.reviewedAt = new Date();
    flaggedContent.reviewNotes = reviewNotes;
    flaggedContent.resolved = resolved;

    return this.flaggedContentRepository.save(flaggedContent);
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(churchId: string) {
    const totalCount = await this.flaggedContentRepository.count({
      where: { churchId },
    });

    const unresolvedCount = await this.flaggedContentRepository.count({
      where: { churchId, resolved: false },
    });

    const highSeverityCount = await this.flaggedContentRepository.count({
      where: { churchId, severity: ContentFlagSeverity.HIGH, resolved: false },
    });

    // Get count by content type
    const contentTypeCounts = await this.flaggedContentRepository
      .createQueryBuilder('flagged')
      .select('flagged.contentType', 'contentType')
      .addSelect('COUNT(*)', 'count')
      .where('flagged.churchId = :churchId', { churchId })
      .groupBy('flagged.contentType')
      .getRawMany();

    return {
      totalCount,
      unresolvedCount,
      highSeverityCount,
      contentTypeCounts,
    };
  }

  /**
   * Delete a flagged content record
   */
  async deleteFlaggedContent(id: string, churchId: string): Promise<void> {
    const flaggedContent = await this.getFlaggedContentById(id, churchId);
    await this.flaggedContentRepository.remove(flaggedContent);
  }

  /**
   * Delete old resolved flags
   * @param olderThan Date threshold for deletion
   * @returns DeleteResult with the number of affected rows
   */
  async deleteOldResolvedFlags(olderThan: Date) {
    this.logger.debug(`Deleting resolved flags older than ${olderThan.toISOString()}`);
    
    return this.flaggedContentRepository
      .createQueryBuilder('flagged')
      .delete()
      .where('resolved = :resolved', { resolved: true })
      .andWhere('updatedAt < :olderThan', { olderThan })
      .execute();
  }

  /**
   * Send notification for high severity flagged content
   */
  private async notifyHighSeverityFlag(flaggedContent: FlaggedContent): Promise<void> {
    this.logger.debug(`Sending notification for high severity flagged content: ${flaggedContent.id}`);
    
    try {
      // Get the primary reason for flagging or use a default
      const primaryReason = flaggedContent.reasons.length > 0 
        ? flaggedContent.reasons[0] 
        : 'Content flagged for review';
      
      await this.notificationService.sendModerationAlert(
        flaggedContent.churchId,
        flaggedContent.contentType,
        flaggedContent.contentId,
        flaggedContent.severity,
        primaryReason,
        flaggedContent.snippet,
      );
    } catch (error) {
      this.logger.error(`Error sending notification for flagged content: ${error.message}`, error.stack);
    }
  }
}
