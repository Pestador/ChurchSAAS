import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, MaxLength, IsUUID } from 'class-validator';
import { PrayerRequestVisibility, PrayerRequestStatus } from '../../../entities/prayer-request.entity';

export class CreatePrayerRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(PrayerRequestVisibility)
  @IsOptional()
  visibility?: PrayerRequestVisibility; // Defaults in entity

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedBibleVerses?: string[];

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  authorId?: string; // Alias for userId for consistent naming across modules

  @IsUUID()
  @IsOptional()
  churchId?: string;
}
