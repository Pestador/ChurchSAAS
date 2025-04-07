import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum } from 'class-validator';

export enum ExplanationDepth {
  BASIC = 'basic',
  STANDARD = 'standard',
  DETAILED = 'detailed'
}

export enum ExplanationStyle {
  ACADEMIC = 'academic',
  CONVERSATIONAL = 'conversational',
  DEVOTIONAL = 'devotional',
  PASTORAL = 'pastoral'
}

export class GenerateExplanationDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'At least one Bible verse is required' })
  bibleVerses: string[];

  @IsString()
  @IsOptional()
  context?: string;
  
  @IsEnum(ExplanationDepth)
  @IsOptional()
  depth?: ExplanationDepth = ExplanationDepth.STANDARD;
  
  @IsEnum(ExplanationStyle)
  @IsOptional()
  style?: ExplanationStyle = ExplanationStyle.CONVERSATIONAL;
  
  @IsString()
  @IsOptional()
  targetAudience?: string;
}
