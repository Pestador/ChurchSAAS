import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BibleStudyStatus } from '../../../entities/bible-study.entity';

export class UpdateBibleStudyDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bibleVerses?: string[];

  @IsEnum(BibleStudyStatus)
  @IsOptional()
  status?: BibleStudyStatus;

  @IsBoolean()
  @IsOptional()
  isAiGenerated?: boolean;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  aiGeneratedExplanations?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  viewCount?: number;
}
