import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ValidationPipe, UsePipes, ParseUUIDPipe, Query, ForbiddenException } from '@nestjs/common';
import { PrayerRequestsService } from './prayer-requests.service';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
import { UpdatePrayerRequestDto } from './dto/update-prayer-request.dto';
import { PrayerRequest, PrayerRequestStatus, PrayerRequestVisibility } from '../../entities/prayer-request.entity';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChurchTenantGuard } from '../../common/guards/church-tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('prayer-requests')
@UseGuards(JwtAuthGuard, RolesGuard, ChurchTenantGuard)
export class PrayerRequestsController {
  constructor(private readonly prayerRequestsService: PrayerRequestsService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
  ): Promise<PrayerRequest[]> {
    const { id: userId, churchId, role } = req.user;
    return this.prayerRequestsService.findAll(churchId, userId, role, status, visibility);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<PrayerRequest> {
    const { id: userId, churchId, role } = req.user;
    return this.prayerRequestsService.findOne(id, churchId, userId, role);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PASTOR, UserRole.MEMBER)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createPrayerRequestDto: CreatePrayerRequestDto, @Request() req): Promise<PrayerRequest> {
    const { id: userId, churchId } = req.user;
    
    // Set the churchId and userId based on the authenticated user
    createPrayerRequestDto.churchId = churchId;
    createPrayerRequestDto.userId = userId;
    
    return this.prayerRequestsService.create(createPrayerRequestDto, userId, churchId);
  }

  @Post(':id/ai-response')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async generateAiResponse(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<PrayerRequest> {
    const { id: userId, churchId, role } = req.user;
    
    // For non-admin users, check subscription
    if (role !== UserRole.ADMIN) {
      const church = await this.prayerRequestsService.getChurchWithSubscription(churchId);
      
      // Check if church has AI response privileges based on subscription
      if (church.subscriptionPlan === 'free') {
        throw new ForbiddenException('AI responses require a paid subscription');
      }
    }
    
    return this.prayerRequestsService.addAiResponse(id, churchId);
  }

  @Post(':id/pray')
  @Roles(UserRole.ADMIN, UserRole.PASTOR, UserRole.MEMBER)
  async pray(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<PrayerRequest> {
    const { churchId } = req.user;
    return this.prayerRequestsService.incrementPrayerCount(id, churchId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePrayerRequestDto: UpdatePrayerRequestDto, @Request() req): Promise<PrayerRequest> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the prayer request to verify ownership
    const prayerRequest = await this.prayerRequestsService.findOne(id, churchId, userId, role);
    
    // Verify ownership or proper role
    const isOwner = prayerRequest.userId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only update your own prayer requests');
    }
    
    return this.prayerRequestsService.update(id, updatePrayerRequestDto, userId, churchId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PrayerRequestStatus,
    @Request() req,
  ): Promise<PrayerRequest> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the prayer request to verify ownership and access rights
    const prayerRequest = await this.prayerRequestsService.findOne(id, churchId, userId, role);
    
    // Check if user is the author or has elevated permissions
    const isOwner = prayerRequest.userId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only update the status of your own prayer requests');
    }
    
    return this.prayerRequestsService.updateStatus(id, status, churchId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the prayer request to verify ownership
    const prayerRequest = await this.prayerRequestsService.findOne(id, churchId, userId, role);
    
    // Check if user has permission to delete
    const isOwner = prayerRequest.userId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only delete your own prayer requests');
    }
    
    return this.prayerRequestsService.remove(id, userId, churchId);
  }

  @Post(':id/increment-prayer-count')
  @Roles(UserRole.ADMIN, UserRole.PASTOR, UserRole.MEMBER)
  async incrementPrayerCount(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<PrayerRequest> {
    const { churchId } = req.user;
    return this.prayerRequestsService.incrementPrayerCount(id, churchId);
  }
}
