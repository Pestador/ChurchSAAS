import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsEnum(UserRole)
  @IsOptional() // Role might be assigned automatically or default
  role?: UserRole;

  @IsUUID()
  @IsNotEmpty() // Assuming churchId is required for user creation context
  churchId: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
