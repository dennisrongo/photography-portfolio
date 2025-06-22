import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
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

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}