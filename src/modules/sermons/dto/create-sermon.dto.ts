import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsBoolean, IsObject, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { SermonStatus } from '../../../entities/sermon.entity';

export class CreateSermonDto {
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
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : (value ? [value] : []))
  bibleVerses?: string[];

  @IsString()
  @IsOptional()
  theme?: string;

  @IsEnum(SermonStatus)
  @IsOptional()
  status?: SermonStatus;

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
  aiPrompt?: Record<string, any>;
}
