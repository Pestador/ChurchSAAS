import { IsEnum, IsString, IsBoolean, IsNumber, IsArray, IsUUID, IsDate, IsOptional } from 'class-validator';
import { ContentFlagCategory, ContentFlagSeverity } from '../../../services/content-moderation.service';

export class FlaggedContentDto {
  @IsUUID()
  id: string;

  @IsString()
  contentType: string; // 'prayer_request', 'sermon', 'comment', etc.

  @IsUUID()
  contentId: string;

  @IsString()
  snippet: string;

  @IsBoolean()
  isFlagged: boolean;

  @IsEnum(ContentFlagSeverity)
  severity: ContentFlagSeverity;

  @IsArray()
  @IsEnum(ContentFlagCategory, { each: true })
  categories: ContentFlagCategory[];

  @IsArray()
  @IsString({ each: true })
  reasons: string[];

  @IsNumber()
  moderationScore: number;

  @IsDate()
  flaggedAt: Date;

  @IsUUID()
  churchId: string;

  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  @IsOptional()
  @IsDate()
  reviewedAt?: Date;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsBoolean()
  resolved?: boolean;
}
