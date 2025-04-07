import { IsString, IsNotEmpty, IsEnum, IsArray, IsUUID, IsOptional, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { BibleStudyStatus } from '../../../entities/bible-study.entity';

export class CreateBibleStudyDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'At least one Bible verse is required' })
  bibleVerses: string[];

  @IsEnum(BibleStudyStatus)
  @IsOptional()
  status?: BibleStudyStatus;

  @IsUUID()
  @IsNotEmpty({ message: 'Author ID is required' })
  authorId: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Church ID is required' })
  churchId: string;

  @IsBoolean()
  @IsOptional()
  isAiGenerated?: boolean;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  aiGeneratedExplanations?: Record<string, any>;
}
