import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { VoiceAccent, VoiceGender, VoiceStyle } from '../../../services/elevenlabs.service';

export class GenerateTTSDto {
  @IsOptional()
  @IsString()
  text?: string;
  
  @IsOptional()
  @IsString()
  voiceId?: string;
  
  @IsOptional()
  @IsEnum(VoiceGender)
  gender?: VoiceGender;
  
  @IsOptional()
  @IsEnum(VoiceAccent)
  accent?: VoiceAccent;
  
  @IsOptional()
  @IsEnum(VoiceStyle)
  style?: VoiceStyle;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  stability?: number;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarity_boost?: number;
  
  @IsOptional()
  @IsString()
  modelId?: string;
}
