import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';

export enum ContentFlagSeverity {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
}

export enum ContentFlagCategory {
  HATE = 'HATE',
  HARASSMENT = 'HARASSMENT',
  SEXUAL = 'SEXUAL',
  VIOLENCE = 'VIOLENCE',
  SELF_HARM = 'SELF_HARM',
  ILLEGAL_ACTIVITY = 'ILLEGAL_ACTIVITY',
  MISLEADING = 'MISLEADING',
  POLITICAL = 'POLITICAL',
  OTHER = 'OTHER',
}

export interface ContentModerationResult {
  isFlagged: boolean;
  severity: ContentFlagSeverity;
  categories: ContentFlagCategory[];
  reasons: string[];
  moderationScore: number;
}

interface ModerationOption {
  blockSeverity?: ContentFlagSeverity;
  enableCategories?: ContentFlagCategory[];
  threshold?: number;
}

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private readonly defaultOptions: ModerationOption = {
    blockSeverity: ContentFlagSeverity.MEDIUM,
    enableCategories: Object.values(ContentFlagCategory),
    threshold: 0.7,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly openAIService: OpenAIService,
  ) {}

  /**
   * Moderate content using OpenAI's moderation API
   * @param content The text content to moderate
   * @param options Moderation options
   * @returns ContentModerationResult with flag information
   */
  async moderateContent(
    content: string,
    options: ModerationOption = this.defaultOptions,
  ): Promise<ContentModerationResult> {
    this.logger.debug(`Moderating content: ${content.substring(0, 50)}...`);
    
    try {
      // For now, we'll use a simplified approach
      // In a production system, you'd make an API call to OpenAI's moderation endpoint
      // or use a dedicated content moderation service
      
      const result = await this.analyzeContentWithOpenAI(content);
      
      return result;
    } catch (error) {
      this.logger.error(`Error moderating content: ${error.message}`, error.stack);
      
      // Default to safe in case of error to avoid blocking legitimate content
      return {
        isFlagged: false,
        severity: ContentFlagSeverity.NONE,
        categories: [],
        reasons: ['Error processing content moderation'],
        moderationScore: 0,
      };
    }
  }

  /**
   * Analyze content using OpenAI to detect problematic patterns
   * This is a simplified implementation - in production you would use
   * OpenAI's dedicated moderation endpoint with a prompt tuned for content moderation
   */
  private async analyzeContentWithOpenAI(
    content: string,
  ): Promise<ContentModerationResult> {
    // Here we would make a call to OpenAI's moderation endpoint
    // For now we'll simulate the response
    
    // Check for obvious problematic keywords
    const hateSpeechPatterns = [
      'hate', 'racist', 'bigot', 'nazi', 'antisemit', 
      'discriminat', 'supremac'
    ];
    
    const violencePatterns = [
      'kill', 'murder', 'attack', 'hurt', 'destroy',
      'violent', 'weapon', 'gun', 'bomb'
    ];
    
    const sexualPatterns = [
      'explicit', 'porn', 'sexual', 'xxx', 'nude'
    ];
    
    const detectedCategories: ContentFlagCategory[] = [];
    const reasons: string[] = [];
    let score = 0;
    
    // Perform simple pattern matching
    // This is a very basic approach - a real solution would use ML models
    
    // Check for hate speech
    if (this.containsPatterns(content.toLowerCase(), hateSpeechPatterns)) {
      detectedCategories.push(ContentFlagCategory.HATE);
      reasons.push('Potential hate speech detected');
      score += 0.7;
    }
    
    // Check for violence
    if (this.containsPatterns(content.toLowerCase(), violencePatterns)) {
      detectedCategories.push(ContentFlagCategory.VIOLENCE);
      reasons.push('Potential violent content detected');
      score += 0.5;
    }
    
    // Check for sexual content
    if (this.containsPatterns(content.toLowerCase(), sexualPatterns)) {
      detectedCategories.push(ContentFlagCategory.SEXUAL);
      reasons.push('Potential inappropriate sexual content detected');
      score += 0.6;
    }
    
    // Normalize the score
    const normalizedScore = Math.min(score, 1);
    
    // Determine severity based on score
    let severity = ContentFlagSeverity.NONE;
    if (normalizedScore > 0.8) {
      severity = ContentFlagSeverity.HIGH;
    } else if (normalizedScore > 0.5) {
      severity = ContentFlagSeverity.MEDIUM;
    } else if (normalizedScore > 0.2) {
      severity = ContentFlagSeverity.LOW;
    }
    
    return {
      isFlagged: normalizedScore > 0.5,
      severity,
      categories: detectedCategories,
      reasons,
      moderationScore: normalizedScore,
    };
  }
  
  /**
   * Check if content contains any of the specified patterns
   */
  private containsPatterns(content: string, patterns: string[]): boolean {
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * This method will moderate the content in real-time pre-submission
   * Returns true if content is safe, false if it's flagged
   */
  async preSubmissionFilter(content: string): Promise<boolean> {
    const result = await this.moderateContent(content);
    
    // Block content with medium or high severity
    return !(result.severity === ContentFlagSeverity.MEDIUM || 
           result.severity === ContentFlagSeverity.HIGH);
  }

  /**
   * Scan and flag problematic content for admin review
   * This can be used after content is submitted to generate reports
   */
  async scanContentForFlags(content: string): Promise<ContentModerationResult> {
    return this.moderateContent(content, {
      // For admin review, we'll flag at a lower threshold
      blockSeverity: ContentFlagSeverity.LOW,
      threshold: 0.3,
    });
  }
}
