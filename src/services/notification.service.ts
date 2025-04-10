import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Church } from '../entities/church.entity';
import { ContentFlagSeverity } from './content-moderation.service';

export enum NotificationType {
  MODERATION_ALERT = 'moderation_alert',
  SYSTEM_ALERT = 'system_alert',
  USER_MESSAGE = 'user_message',
}

export interface EmailNotification {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,
  ) {}

  /**
   * Send a notification about flagged content to church administrators
   */
  async sendModerationAlert(
    churchId: string,
    contentType: string,
    contentId: string,
    severity: ContentFlagSeverity,
    reason: string,
    snippet: string,
  ): Promise<void> {
    this.logger.debug(`Sending moderation alert for ${contentType} ${contentId} in church ${churchId}`);

    try {
      // Find church admins and pastors
      const admins = await this.userRepository.find({
        where: [
          { churchId, role: UserRole.ADMIN },
          { churchId, role: UserRole.PASTOR },
        ],
      });

      if (!admins || admins.length === 0) {
        this.logger.warn(`No admins found for church ${churchId}`);
        return;
      }

      // Get church details
      const church = await this.churchRepository.findOne({
        where: { id: churchId },
      });

      if (!church) {
        this.logger.warn(`Church not found: ${churchId}`);
        return;
      }

      // Create email notification
      const subject = `[${church.name}] Content Moderation Alert: ${this.getSeverityText(severity)}`;
      
      // Truncate snippet if too long
      const truncatedSnippet = snippet.length > 100 
        ? snippet.substring(0, 97) + '...' 
        : snippet;

      // Create email body
      const text = `
        Content Moderation Alert
        
        Church: ${church.name}
        Content Type: ${this.formatContentType(contentType)}
        Severity: ${this.getSeverityText(severity)}
        Reason: ${reason}
        
        Content Snippet:
        "${truncatedSnippet}"
        
        Please log in to the moderation dashboard to review this content.
      `;

      const html = `
        <h2>Content Moderation Alert</h2>
        <p>Potentially inappropriate content has been flagged in your church platform.</p>
        
        <ul>
          <li><strong>Church:</strong> ${church.name}</li>
          <li><strong>Content Type:</strong> ${this.formatContentType(contentType)}</li>
          <li><strong>Severity:</strong> <span style="color:${this.getSeverityColor(severity)}">${this.getSeverityText(severity)}</span></li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
        
        <p><strong>Content Snippet:</strong></p>
        <blockquote style="padding: 10px; border-left: 4px solid #eee; margin-left: 0;">${truncatedSnippet}</blockquote>
        
        <p>Please <a href="${this.configService.get('APP_URL', 'https://app.churchsaas.com')}/moderation/dashboard">log in to the moderation dashboard</a> to review this content.</p>
      `;

      // Send email to each admin
      for (const admin of admins) {
        await this.sendEmail({
          to: admin.email,
          subject,
          text,
          html,
        });
      }

      this.logger.debug(`Sent moderation alerts to ${admins.length} admins for church ${churchId}`);
    } catch (error) {
      this.logger.error(`Error sending moderation alert: ${error.message}`, error.stack);
    }
  }

  /**
   * Send an email notification
   * This is a placeholder implementation - in a production system,
   * you would integrate with an email service (SendGrid, AWS SES, etc.)
   */
  private async sendEmail(notification: EmailNotification): Promise<void> {
    // In a real implementation, you would send the email via SMTP or an email service API
    this.logger.debug(`[EMAIL] To: ${notification.to}, Subject: ${notification.subject}`);

    // Log that we'd normally send an email here
    this.logger.log(`Email would be sent to ${notification.to}`);
    
    // In development, we'll just log the email content
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.debug(`Email Text Content: ${notification.text}`);
    }

    // In a real implementation, this would call an email service
    // await emailService.sendMail({
    //   to: notification.to,
    //   subject: notification.subject,
    //   text: notification.text,
    //   html: notification.html,
    // });
  }

  /**
   * Format content type for display
   */
  private formatContentType(contentType: string): string {
    // Convert snake_case to Title Case
    return contentType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get text representation of severity level
   */
  private getSeverityText(severity: ContentFlagSeverity): string {
    switch (severity) {
      case ContentFlagSeverity.HIGH:
        return 'High Severity';
      case ContentFlagSeverity.MEDIUM:
        return 'Medium Severity';
      case ContentFlagSeverity.LOW:
        return 'Low Severity';
      default:
        return 'No Concerns';
    }
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: ContentFlagSeverity): string {
    switch (severity) {
      case ContentFlagSeverity.HIGH:
        return '#dc3545'; // red
      case ContentFlagSeverity.MEDIUM:
        return '#fd7e14'; // orange
      case ContentFlagSeverity.LOW:
        return '#ffc107'; // yellow
      default:
        return '#6c757d'; // gray
    }
  }
}
