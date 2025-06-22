import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../../auth/services/supabase.service';
import { CreateUserDto, UpdateUserDto, UpdateUserPasswordDto, GetUsersQueryDto } from '../dtos/user.dto';
import { User, CreateUserRequest, UpdateUserRequest, UserListResponse } from '../entities/user.entity';
import { AuthUser } from '../../auth/entities/user.entity';

@Injectable()
export class UserService {
  constructor(private supabaseService: SupabaseService) {}

  async createUser(createUserDto: CreateUserDto, currentUser: AuthUser): Promise<User> {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can create users');
    }

    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      
      const userData: CreateUserRequest = {
        email: createUserDto.email,
        password: hashedPassword,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        role: createUserDto.role || 'photographer',
      };

      const authData = await this.supabaseService.createUser(
        createUserDto.email,
        createUserDto.password,
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

        return userRecord;
      }

      throw new Error('User creation failed');
    } catch (error) {
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async getUsers(query: GetUsersQueryDto): Promise<UserListResponse> {
    const { page = 1, limit = 10, role, search } = query;
    const offset = (page - 1) * limit;

    let queryBuilder = this.supabaseService.getClient()
      .from('users')
      .select('*', { count: 'exact' });

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    if (search) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return {
      users: data || [],
      total: count || 0,
      page,
      limit,
    };
  }

  async getUserById(id: string): Promise<User> {
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }

    return data;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, currentUser: AuthUser): Promise<User> {
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile or be an admin');
    }

    if (updateUserDto.role && currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can change user roles');
    }

    const existingUser = await this.getUserById(id);

    const updateData: UpdateUserRequest = {};
    
    if (updateUserDto.first_name !== undefined) {
      updateData.first_name = updateUserDto.first_name;
    }
    
    if (updateUserDto.last_name !== undefined) {
      updateData.last_name = updateUserDto.last_name;
    }
    
    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }

    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async updateUserPassword(id: string, updatePasswordDto: UpdateUserPasswordDto, currentUser: AuthUser): Promise<void> {
    if (currentUser.id !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    const existingUser = await this.getUserById(id);

    const isCurrentPasswordValid = await bcrypt.compare(
      updatePasswordDto.current_password,
      existingUser.password_hash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(updatePasswordDto.new_password, 10);

    const { error } = await this.supabaseService.getClient()
      .from('users')
      .update({ password_hash: hashedNewPassword })
      .eq('id', id);

    if (error) throw error;

    try {
      await this.supabaseService.getClient().auth.updateUser({
        password: updatePasswordDto.new_password
      });
    } catch (authError) {
      console.warn('Failed to update Supabase auth password:', authError);
    }
  }

  async deleteUser(id: string, currentUser: AuthUser): Promise<void> {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (currentUser.id === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const existingUser = await this.getUserById(id);

    const { error } = await this.supabaseService.getClient()
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    try {
      await this.supabaseService.getClient().auth.admin.deleteUser(id);
    } catch (authError) {
      console.warn('Failed to delete Supabase auth user:', authError);
    }
  }

  async getUserStats(): Promise<{ total: number; photographers: number; admins: number }> {
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('role');

    if (error) throw error;

    const total = data.length;
    const photographers = data.filter(user => user.role === 'photographer').length;
    const admins = data.filter(user => user.role === 'admin').length;

    return { total, photographers, admins };
  }
}