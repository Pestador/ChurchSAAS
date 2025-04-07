import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ValidationPipe, UsePipes, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChurchTenantGuard } from '../../common/guards/church-tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, ChurchTenantGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async findAll(@Request() req): Promise<User[]> {
    // Use the churchId from JWT token for multi-tenancy
    const { churchId, role } = req.user;
    
    // Admin can see all users, pastors can only see users in their church
    if (role === UserRole.ADMIN) {
      return this.usersService.findAll();
    } else {
      return this.usersService.findAllByChurch(churchId);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<User> {
    const { churchId, id: requestUserId, role } = req.user;
    
    // Users can see their own profile, pastors can see users in their church, admins can see any user
    if (id === requestUserId || role === UserRole.ADMIN) {
      return this.usersService.findOne(id);
    } else if (role === UserRole.PASTOR) {
      return this.usersService.findOneInChurch(id, churchId);
    } else {
      // Regular members can only see themselves
      throw new ForbiddenException('You can only view your own profile');
    }
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async create(@Body() createUserDto: CreateUserDto, @Request() req): Promise<User> {
    const { churchId, role } = req.user;
    
    // Ensure tenant isolation - users can only be created in their own church
    if (role !== UserRole.ADMIN && createUserDto.churchId !== churchId) {
      throw new ForbiddenException('You can only create users for your own church');
    }
    
    // Pastor can only create regular members, not other pastors or admins
    if (role === UserRole.PASTOR && 
        (createUserDto.role === UserRole.PASTOR || createUserDto.role === UserRole.ADMIN)) {
      throw new ForbiddenException('You can only create members, not pastors or admins');
    }
    
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto, @Request() req): Promise<User> {
    const { churchId, id: requestingUserId, role } = req.user;
    
    // Check if user is updating their own profile
    const isSelfUpdate = id === requestingUserId;
    
    // Users can update themselves, but not their role
    if (isSelfUpdate) {
      if (updateUserDto.role && updateUserDto.role !== req.user.role) {
        throw new ForbiddenException('You cannot change your own role');
      }
      return this.usersService.update(id, updateUserDto);
    }
    
    // Admins can update anyone
    if (role === UserRole.ADMIN) {
      return this.usersService.update(id, updateUserDto);
    }
    
    // Pastors can update members in their church, but not other pastors or admins
    if (role === UserRole.PASTOR) {
      // Get the user to check their role and church
      const userToUpdate = await this.usersService.findOne(id);
      
      if (userToUpdate.churchId !== churchId) {
        throw new ForbiddenException('You can only update users in your own church');
      }
      
      if (userToUpdate.role === UserRole.PASTOR || userToUpdate.role === UserRole.ADMIN) {
        throw new ForbiddenException('You cannot update other pastors or admins');
      }
      
      // Pastors cannot upgrade members to pastors or admins
      if (updateUserDto.role === UserRole.PASTOR || updateUserDto.role === UserRole.ADMIN) {
        throw new ForbiddenException('You cannot promote users to pastor or admin roles');
      }
      
      return this.usersService.update(id, updateUserDto);
    }
    
    // Regular members cannot update other users
    throw new ForbiddenException('You can only update your own profile');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    const { churchId, id: requestingUserId, role } = req.user;
    
    // Prevent users from deleting themselves
    if (id === requestingUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    
    // Admins can delete anyone
    if (role === UserRole.ADMIN) {
      return this.usersService.remove(id);
    }
    
    // Pastors can only delete members in their church
    if (role === UserRole.PASTOR) {
      // Get the user to check their role and church
      const userToDelete = await this.usersService.findOne(id);
      
      if (userToDelete.churchId !== churchId) {
        throw new ForbiddenException('You can only delete users in your own church');
      }
      
      if (userToDelete.role === UserRole.PASTOR || userToDelete.role === UserRole.ADMIN) {
        throw new ForbiddenException('You cannot delete other pastors or admins');
      }
      
      return this.usersService.remove(id);
    }
  }
}
