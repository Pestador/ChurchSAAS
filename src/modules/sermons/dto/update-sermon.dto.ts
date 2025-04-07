import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsObject, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { SermonStatus } from '../../../entities/sermon.entity';

export class UpdateSermonDto {
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
  @Transform(({ value }) => Array.isArray(value) ? value : (value ? [value] : []))
  bibleVerses?: string[];

  @IsString()
  @IsOptional()
  theme?: string;

  @IsEnum(SermonStatus)
  @IsOptional()
  status?: SermonStatus;

  @IsBoolean()
  @IsOptional()
  isAiGenerated?: boolean;

  @IsObject()
  @IsOptional()
  aiPrompt?: Record<string, any>;

  @IsUrl()
  @IsOptional()
  pdfUrl?: string;

  @IsUrl()
  @IsOptional()
  docxUrl?: string;
}
