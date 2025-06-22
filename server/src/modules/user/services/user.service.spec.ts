import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { SupabaseService } from '../../auth/services/supabase.service';
import { CreateUserDto, UpdateUserDto, UpdateUserPasswordDto, GetUsersQueryDto } from '../dtos/user.dto';
import { AuthUser } from '../../auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockAdminUser: AuthUser = {
    id: 'admin-id',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
  };

  const mockPhotographerUser: AuthUser = {
    id: 'photographer-id',
    email: 'photographer@example.com',
    first_name: 'Photographer',
    last_name: 'User',
    role: 'photographer',
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'photographer' as const,
    password_hash: 'hashed-password',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSupabaseClient = {
    from: jest.fn(),
    auth: {
      updateUser: jest.fn(),
      admin: {
        deleteUser: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: SupabaseService,
          useValue: {
            createUser: jest.fn(),
            createUserRecord: jest.fn(),
            getClient: jest.fn(() => mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    supabaseService = module.get(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      first_name: 'New',
      last_name: 'User',
      role: 'photographer',
    };

    it('should create a user when called by admin', async () => {
      const hashedPassword = 'hashed-password';
      const mockAuthData = {
        user: { 
          id: 'new-user-id', 
          email: 'newuser@example.com',
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
            id: 'new-user-id',
            email: 'newuser@example.com',
            aud: 'authenticated',
            role: 'authenticated',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }
        },
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      supabaseService.createUser.mockResolvedValue(mockAuthData as any);
      supabaseService.createUserRecord.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
      });

      const result = await service.createUser(createUserDto, mockAdminUser);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(supabaseService.createUser).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        {
          first_name: 'New',
          last_name: 'User',
          role: 'photographer',
        }
      );
      expect(result.email).toBe('newuser@example.com');
    });

    it('should throw ForbiddenException when called by non-admin', async () => {
      await expect(
        service.createUser(createUserDto, mockPhotographerUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when email already exists', async () => {
      const error = new Error('already registered');
      supabaseService.createUser.mockRejectedValue(error);

      await expect(
        service.createUser(createUserDto, mockAdminUser)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getUsers', () => {
    const mockQueryResult = {
      data: [mockUser],
      error: null,
      count: 1,
    };

    beforeEach(() => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockQueryResult),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
    });

    it('should return paginated users', async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };

      const result = await service.getUsers(query);

      expect(result).toEqual({
        users: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should filter by role when provided', async () => {
      const query: GetUsersQueryDto = { role: 'photographer' };
      const mockQuery = mockSupabaseClient.from().select();

      await service.getUsers(query);

      expect(mockQuery.eq).toHaveBeenCalledWith('role', 'photographer');
    });

    it('should search users when search term provided', async () => {
      const query: GetUsersQueryDto = { search: 'test' };
      const mockQuery = mockSupabaseClient.from().select();

      await service.getUsers(query);

      expect(mockQuery.or).toHaveBeenCalledWith(
        'first_name.ilike.%test%,last_name.ilike.%test%,email.ilike.%test%'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.getUserById('test-user-id');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(service.getUserById('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    beforeEach(() => {
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);
    });

    it('should allow admin to update any user', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUser, ...updateUserDto },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.updateUser(
        'test-user-id',
        updateUserDto,
        mockAdminUser
      );

      expect(result.first_name).toBe('Updated');
      expect(result.last_name).toBe('Name');
    });

    it('should allow user to update their own profile', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUser, ...updateUserDto },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.updateUser(
        'photographer-id',
        updateUserDto,
        mockPhotographerUser
      );

      expect(result.first_name).toBe('Updated');
    });

    it('should prevent non-admin from updating other users', async () => {
      await expect(
        service.updateUser('different-id', updateUserDto, mockPhotographerUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent non-admin from changing roles', async () => {
      const roleUpdateDto: UpdateUserDto = { role: 'admin' };

      await expect(
        service.updateUser('photographer-id', roleUpdateDto, mockPhotographerUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateUserPassword', () => {
    const updatePasswordDto: UpdateUserPasswordDto = {
      current_password: 'oldpassword',
      new_password: 'newpassword',
    };

    beforeEach(() => {
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);
    });

    it('should update password when current password is correct', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockSupabaseClient.auth.updateUser.mockResolvedValue({});

      await service.updateUserPassword(
        'photographer-id',
        updatePasswordDto,
        mockPhotographerUser
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', 'hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updateUserPassword('photographer-id', updatePasswordDto, mockPhotographerUser)
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent users from changing other users passwords', async () => {
      await expect(
        service.updateUserPassword('different-id', updatePasswordDto, mockPhotographerUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteUser', () => {
    it('should allow admin to delete other users', async () => {
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);
      
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({});

      await service.deleteUser('test-user-id', mockAdminUser);

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-user-id');
    });

    it('should prevent non-admin from deleting users', async () => {
      await expect(
        service.deleteUser('test-user-id', mockPhotographerUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent admin from deleting their own account', async () => {
      await expect(
        service.deleteUser('admin-id', mockAdminUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockUsers = [
        { role: 'photographer' },
        { role: 'photographer' },
        { role: 'admin' },
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.getUserStats();

      expect(result).toEqual({
        total: 3,
        photographers: 2,
        admins: 1,
      });
    });
  });
});