import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from './supabase.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import { AuthUser, CreateUserRequest } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      
      const userData: CreateUserRequest = {
        email: registerDto.email,
        password: hashedPassword,
        first_name: registerDto.first_name,
        last_name: registerDto.last_name,
        role: registerDto.role || 'photographer',
      };

      const authData = await this.supabaseService.createUser(
        registerDto.email,
        registerDto.password,
        {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        }
      );

      if (authData.user) {
        const userRecord = await this.supabaseService.createUserRecord({
          id: authData.user.id,
          email: userData.email,
          password_hash: userData.password,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        });

        const payload = {
          sub: userRecord.id,
          email: userRecord.email,
          role: userRecord.role,
        };

        return {
          access_token: this.jwtService.sign(payload),
          user: {
            id: userRecord.id,
            email: userRecord.email,
            first_name: userRecord.first_name,
            last_name: userRecord.last_name,
            role: userRecord.role,
          },
        };
      }

      throw new Error('User creation failed');
    } catch (error) {
      if (error.message?.includes('already registered')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const authData = await this.supabaseService.signIn(
        loginDto.email,
        loginDto.password
      );

      if (authData.user) {
        const userRecord = await this.supabaseService.getUserById(authData.user.id);

        const payload = {
          sub: userRecord.id,
          email: userRecord.email,
          role: userRecord.role,
        };

        return {
          access_token: this.jwtService.sign(payload),
          user: {
            id: userRecord.id,
            email: userRecord.email,
            first_name: userRecord.first_name,
            last_name: userRecord.last_name,
            role: userRecord.role,
          },
        };
      }

      throw new UnauthorizedException('Invalid credentials');
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateUser(payload: any): Promise<AuthUser> {
    try {
      const user = await this.supabaseService.getUserById(payload.sub);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}