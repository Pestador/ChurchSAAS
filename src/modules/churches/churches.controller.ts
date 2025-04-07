import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, UsePipes, ParseUUIDPipe, ForbiddenException, Request } from '@nestjs/common';
import { ChurchesService } from './churches.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';
import { Church } from '../../entities/church.entity';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChurchTenantGuard } from '../../common/guards/church-tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('churches')
@UseGuards(JwtAuthGuard, RolesGuard, ChurchTenantGuard)
export class ChurchesController {
  constructor(private readonly churchesService: ChurchesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createChurchDto: CreateChurchDto): Promise<Church> {
    // Only platform admins can create new churches (tenants)
    return this.churchesService.create(createChurchDto);
  }

  @Get()
  async findAll(@Request() req): Promise<Church[]> {
    const { role, churchId } = req.user;
    
    // Platform admins can view all churches
    if (role === UserRole.ADMIN) {
      return this.churchesService.findAll();
    }
    
    // Non-admin users can only see their own church
    return this.churchesService.findAllByIds([churchId]);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<Church> {
    const { role, churchId } = req.user;
    
    // Platform admins can view any church
    if (role === UserRole.ADMIN) {
      return this.churchesService.findOne(id);
    }
    
    // Non-admin users can only view their own church
    if (id !== churchId) {
      throw new ForbiddenException('You can only view your own church');
    }
    
    return this.churchesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateChurchDto: UpdateChurchDto, @Request() req): Promise<Church> {
    const { role, churchId } = req.user;
    
    // Platform admins can update any church
    if (role === UserRole.ADMIN) {
      return this.churchesService.update(id, updateChurchDto);
    }
    
    // Pastors can only update their own church
    if (id !== churchId) {
      throw new ForbiddenException('You can only update your own church');
    }
    
    // Pastors cannot update subscription-related fields
    if (role === UserRole.PASTOR && (
      updateChurchDto.subscriptionPlan !== undefined ||
      updateChurchDto.stripeCustomerId !== undefined ||
      updateChurchDto.stripeSubscriptionId !== undefined
    )) {
      throw new ForbiddenException('You cannot update subscription-related fields');
    }
    
    return this.churchesService.update(id, updateChurchDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    // Only platform admins can delete churches
    return this.churchesService.remove(id);
  }
}
