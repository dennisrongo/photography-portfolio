import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UpdateUserPasswordDto, GetUsersQueryDto, UserResponseDto } from '../dtos/user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AuthUser } from '../../auth/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @User() currentUser: AuthUser,
  ): Promise<UserResponseDto> {
    const user = await this.userService.createUser(createUserDto, currentUser);
    return this.mapToResponseDto(user);
  }

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto) {
    const result = await this.userService.getUsers(query);
    return {
      ...result,
      users: result.users.map(user => this.mapToResponseDto(user)),
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getUserStats() {
    return this.userService.getUserStats();
  }

  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getUserById(id);
    return this.mapToResponseDto(user);
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() currentUser: AuthUser,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(id, updateUserDto, currentUser);
    return this.mapToResponseDto(user);
  }

  @Put(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUserPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePasswordDto: UpdateUserPasswordDto,
    @User() currentUser: AuthUser,
  ): Promise<void> {
    await this.userService.updateUserPassword(id, updatePasswordDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @User() currentUser: AuthUser,
  ): Promise<void> {
    await this.userService.deleteUser(id, currentUser);
  }

  private mapToResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}