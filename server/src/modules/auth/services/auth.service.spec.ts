import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'photographer',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockAuthData = {
    user: { 
      id: 'test-user-id', 
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    session: { 
      access_token: 'test-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'refresh-token',
      user: { 
        id: 'test-user-id', 
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            createUser: jest.fn(),
            createUserRecord: jest.fn(),
            signIn: jest.fn(),
            getUserById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get(SupabaseService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
      role: 'photographer',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      supabaseService.createUser.mockResolvedValue(mockAuthData as any);
      supabaseService.createUserRecord.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(supabaseService.createUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        {
          first_name: 'Test',
          last_name: 'User',
          role: 'photographer',
        }
      );
      expect(supabaseService.createUserRecord).toHaveBeenCalledWith({
        id: 'test-user-id',
        email: 'test@example.com',
        password_hash: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: 'photographer',
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          role: mockUser.role,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const error = new Error('already registered');
      supabaseService.createUser.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      supabaseService.signIn.mockResolvedValue(mockAuthData as any);
      supabaseService.getUserById.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(supabaseService.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(supabaseService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      supabaseService.signIn.mockRejectedValue(new Error('Invalid credentials'));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid payload', async () => {
      const payload = { sub: 'test-user-id' };
      supabaseService.getUserById.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload);

      expect(supabaseService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        role: mockUser.role,
      });
    });

    it('should return null for invalid payload', async () => {
      const payload = { sub: 'invalid-user-id' };
      supabaseService.getUserById.mockRejectedValue(new Error('User not found'));

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });
  });
});