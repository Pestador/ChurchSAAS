import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException, ParseUUIDPipe } from '@nestjs/common';
import { SermonsService } from './sermons.service';
import { Sermon, SermonStatus } from '../../entities/sermon.entity';
import { UserRole } from '../../entities/user.entity';
import { GenerateSermonDto } from './dto/generate-sermon.dto';
import { CreateSermonDto } from './dto/create-sermon.dto';
import { UpdateSermonDto } from './dto/update-sermon.dto';
import { GenerateTTSDto } from './dto/generate-tts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChurchTenantGuard } from '../../common/guards/church-tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('sermons')
@UseGuards(JwtAuthGuard, RolesGuard, ChurchTenantGuard)
export class SermonsController {
  constructor(private readonly sermonsService: SermonsService) {}

  @Get()
  async findAll(@Request() req): Promise<Sermon[]> {
    const { churchId } = req.user;
    return this.sermonsService.findAll(churchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Sermon> {
    const { churchId } = req.user;
    return this.sermonsService.findOne(id, churchId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async create(@Body() createSermonDto: CreateSermonDto, @Request() req): Promise<Sermon> {
    const { id: userId, churchId, role } = req.user;
    
    // Set the churchId and authorId based on the authenticated user
    createSermonDto.churchId = churchId;
    createSermonDto.authorId = userId;
    
    return this.sermonsService.create(createSermonDto, userId, churchId);
  }

  @Post('ai-generate')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async generateAiSermon(@Body() generateSermonDto: GenerateSermonDto, @Request() req): Promise<Sermon> {
    const { id: userId, churchId, role } = req.user;
    
    // Ensure the user has permissions based on their subscription plan
    // This would ideally be handled by a separate guard, but for simplicity we're handling it here
    if (role !== UserRole.ADMIN) {
      const church = await this.sermonsService.getChurchWithSubscription(churchId);
      
      // Check if the church has AI sermon generation permissions based on subscription
      if (church.subscriptionPlan === 'free') {
        throw new ForbiddenException('AI sermon generation requires a paid subscription');
      }
    }
    
    return this.sermonsService.generateAiSermon(generateSermonDto, userId, churchId);
  }

  @Post(':id/tts')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async generateSermonSpeech(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() generateTTSDto: GenerateTTSDto,
    @Request() req,
  ) {
    const { churchId, role } = req.user;
    
    // Ensure the user has permissions based on their subscription plan
    if (role !== UserRole.ADMIN) {
      const church = await this.sermonsService.getChurchWithSubscription(churchId);
      
      // Check if the church has TTS permissions based on subscription
      if (church.subscriptionPlan === 'free') {
        throw new ForbiddenException('Text-to-speech generation requires a paid subscription');
      }
    }
    
    return this.sermonsService.generateSermonSpeech(id, generateTTSDto, churchId);
  }
  
  @Post('tts/text')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async generateTextSpeech(
    @Body() data: { text: string } & GenerateTTSDto,
    @Request() req,
  ) {
    const { churchId, role } = req.user;
    
    // Ensure the user has permissions based on their subscription plan
    if (role !== UserRole.ADMIN) {
      const church = await this.sermonsService.getChurchWithSubscription(churchId);
      
      // Check if the church has TTS permissions based on subscription
      if (church.subscriptionPlan === 'free') {
        throw new ForbiddenException('Text-to-speech generation requires a paid subscription');
      }
    }
    
    // Extract text and TTS options
    const { text, ...ttsOptions } = data;
    
    // Check if text is provided
    if (!text || text.trim().length === 0) {
      throw new ForbiddenException('Text content is required for speech generation');
    }
    
    return this.sermonsService.generateTextSpeech(text, ttsOptions, churchId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSermonDto: UpdateSermonDto,
    @Request() req,
  ): Promise<Sermon> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the sermon to verify ownership
    const sermon = await this.sermonsService.findOne(id, churchId);
    
    // Only sermon author, pastors, or admins can update sermons
    if (sermon.authorId !== userId && role !== UserRole.PASTOR && role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own sermons');
    }
    
    return this.sermonsService.update(id, updateSermonDto, churchId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: SermonStatus,
    @Request() req,
  ): Promise<Sermon> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the sermon to verify ownership and access rights
    const sermon = await this.sermonsService.findOne(id, churchId);
    
    // For publishing/archiving, only pastors or admins can change status
    if (status === SermonStatus.PUBLISHED && role !== UserRole.PASTOR && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only pastors or admins can publish sermons');
    }
    
    return this.sermonsService.updateStatus(id, status, churchId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the sermon to verify ownership
    const sermon = await this.sermonsService.findOne(id, churchId);
    
    // Check if user has permission to delete the sermon
    const isOwner = sermon.authorId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only delete your own sermons');
    }
    
    return this.sermonsService.remove(id, churchId);
  }
}
