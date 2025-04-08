import { IsString, IsOptional, IsArray, IsEnum, IsNotEmpty, ValidateIf, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { SermonDenomination, SermonTheologicalFramework, SermonStyle } from '../../../services/openai.service';

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
  @IsEnum(SermonStyle)
  style?: SermonStyle;

  @IsOptional()
  @IsEnum(SermonDenomination, {
    message: 'Denomination must be one of: nondenominational, baptist, catholic, methodist, lutheran, presbyterian, pentecostal, anglican, orthodox'
  })
  denomination?: SermonDenomination;

  @IsOptional()
  @IsEnum(SermonTheologicalFramework, {
    message: 'Theological framework must be one of: evangelical, reformed, armenian, liberation, progressive, traditional'
  })
  theologicalFramework?: SermonTheologicalFramework;

  @IsOptional()
  @IsBoolean()
  includeIllustrations?: boolean;

  @IsOptional()
  @IsBoolean()
  includeApplicationPoints?: boolean;

  @IsOptional()
  @IsBoolean()
  includeClosingPrayer?: boolean;

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
