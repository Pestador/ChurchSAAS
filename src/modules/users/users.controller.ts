import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req): Promise<User[]> {
    // User the churchId from JWT token for multi-tenancy
    const { churchId } = req.user;
    return this.usersService.findAll(churchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<User> {
    const { churchId } = req.user;
    return this.usersService.findOne(id, churchId);
  }

  @Post()
  async create(@Body() createUserDto: any, @Request() req): Promise<User> {
    const { churchId } = req.user;
    return this.usersService.create(createUserDto, churchId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @Request() req,
  ): Promise<User> {
    const { churchId } = req.user;
    return this.usersService.update(id, updateUserDto, churchId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const { churchId } = req.user;
    return this.usersService.remove(id, churchId);
  }
}
