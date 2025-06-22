import { IsEmail, IsString, MinLength, IsOptional, IsIn, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  first_name: string;

  @IsString()
  @MinLength(2)
  last_name: string;

  @IsOptional()
  @IsIn(['photographer', 'admin'])
  role?: 'photographer' | 'admin';
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  last_name?: string;

  @IsOptional()
  @IsIn(['photographer', 'admin'])
  role?: 'photographer' | 'admin';
}

export class UpdateUserPasswordDto {
  @IsString()
  @MinLength(6)
  current_password: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}

export class GetUsersQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['photographer', 'admin'])
  role?: 'photographer' | 'admin';

  @IsOptional()
  @IsString()
  search?: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}