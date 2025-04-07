import { IsString, IsOptional, IsUrl, IsEnum, IsEmail, IsBoolean, MaxLength } from 'class-validator';
import { SubscriptionPlan } from '../../../entities/church.entity';

export class UpdateChurchDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlan; // Admins might update this

  @IsString()
  @IsOptional()
  stripeCustomerId?: string; // Managed internally

  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string; // Managed internally

  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // Admin action

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean; // Admin action
}
