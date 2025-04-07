import { IsString, IsNotEmpty, IsOptional, IsUrl, IsEnum, IsEmail, MaxLength } from 'class-validator';
import { SubscriptionPlan } from '../../../entities/church.entity';

export class CreateChurchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

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

  @IsString() // Could add specific phone number validation
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // Subscription plan likely set internally or defaults, not usually user input at creation
  // @IsEnum(SubscriptionPlan)
  // @IsOptional()
  // subscriptionPlan?: SubscriptionPlan;
}
