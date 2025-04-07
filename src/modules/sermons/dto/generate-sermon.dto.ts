import { IsString, IsOptional, IsArray, IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SermonLength {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

export class GenerateSermonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => Array.isArray(value) ? value : (value ? [value] : []))
  bibleVerses?: string[];

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsEnum(SermonLength)
  length?: SermonLength;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  additionalInstructions?: string;

  // At least one of these fields must be specified
  @ValidateIf(o => !o.theme && !o.bibleVerses?.length)
  @IsNotEmpty({ message: 'At least one of title, theme, or bibleVerses must be provided' })
  title2?: string;

  @ValidateIf(o => !o.title && !o.bibleVerses?.length)
  @IsNotEmpty({ message: 'At least one of title, theme, or bibleVerses must be provided' })
  theme2?: string;

  @ValidateIf(o => !o.title && !o.theme && (!o.bibleVerses || o.bibleVerses.length === 0))
  @IsArray()
  @IsNotEmpty({ message: 'At least one of title, theme, or bibleVerses must be provided' })
  bibleVerses2?: string[];
}
