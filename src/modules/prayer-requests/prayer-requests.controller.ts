import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { PrayerRequestsService } from './prayer-requests.service';
import { PrayerRequest, PrayerRequestStatus, PrayerRequestVisibility } from '../../entities/prayer-request.entity';

@Controller('prayer-requests')
export class PrayerRequestsController {
  constructor(private readonly prayerRequestsService: PrayerRequestsService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('visibility') visibility?: PrayerRequestVisibility,
  ): Promise<PrayerRequest[]> {
    const { id: userId, churchId, role } = req.user;
    
    // Admins/pastors can see all prayer requests
    if (role === 'admin' || role === 'pastor') {
      return this.prayerRequestsService.findAll(churchId, null, visibility);
    }
    
    // Regular users can only see their own and public prayer requests
    return this.prayerRequestsService.findAll(churchId, userId, visibility);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<PrayerRequest> {
    const { id: userId, churchId, role } = req.user;
    
    // Admins/pastors can see all prayer requests
    if (role === 'admin' || role === 'pastor') {
      return this.prayerRequestsService.findOne(id, churchId);
    }
    
    // Regular users need additional visibility permission checks
    return this.prayerRequestsService.findOne(id, churchId, userId);
  }

  @Post()
  async create(@Body() createPrayerRequestDto: any, @Request() req): Promise<PrayerRequest> {
    const { id: userId, churchId } = req.user;
    return this.prayerRequestsService.create(createPrayerRequestDto, userId, churchId);
  }

  @Post(':id/ai-response')
  async generateAiResponse(@Param('id') id: string, @Request() req): Promise<PrayerRequest> {
    const { churchId } = req.user;
    return this.prayerRequestsService.addAiResponse(id, churchId);
  }

  @Post(':id/pray')
  async pray(@Param('id') id: string, @Request() req): Promise<PrayerRequest> {
    const { churchId } = req.user;
    return this.prayerRequestsService.incrementPrayerCount(id, churchId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePrayerRequestDto: any,
    @Request() req,
  ): Promise<PrayerRequest> {
    const { id: userId, churchId, role } = req.user;
    
    // Admins/pastors can update any prayer request
    if (role === 'admin' || role === 'pastor') {
      await this.prayerRequestsService.update(id, updatePrayerRequestDto, churchId, null);
      return this.prayerRequestsService.findOne(id, churchId);
    }
    
    // Regular users can only update their own prayer requests
    return this.prayerRequestsService.update(id, updatePrayerRequestDto, churchId, userId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PrayerRequestStatus,
    @Request() req,
  ): Promise<PrayerRequest> {
    const { churchId } = req.user;
    return this.prayerRequestsService.updateStatus(id, status, churchId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const { id: userId, churchId, role } = req.user;
    
    // Admins/pastors can delete any prayer request
    if (role === 'admin' || role === 'pastor') {
      return this.prayerRequestsService.remove(id, churchId, null);
    }
    
    // Regular users can only delete their own prayer requests
    return this.prayerRequestsService.remove(id, churchId, userId);
  }
}
