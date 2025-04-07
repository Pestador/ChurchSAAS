import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, MaxLength } from 'class-validator';
import { PrayerRequestVisibility, PrayerRequestStatus } from '../../../entities/prayer-request.entity';

export class UpdatePrayerRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(PrayerRequestStatus)
  @IsOptional()
  status?: PrayerRequestStatus; // Allow updating status (e.g., to answered/closed)

  @IsEnum(PrayerRequestVisibility)
  @IsOptional()
  visibility?: PrayerRequestVisibility; // Allow changing visibility if permitted

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedBibleVerses?: string[];

  @IsString()
  @IsOptional()
  aiResponse?: string; // Maybe updated internally

  // prayerCount is likely managed internally, not directly updated via DTO
  // @IsNumber()
  // @IsOptional()
  // @Min(0)
  // prayerCount?: number;
}
