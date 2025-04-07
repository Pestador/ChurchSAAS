import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { BibleStudyService } from './bible-study.service';
import { BibleStudy, BibleStudyStatus } from '../../entities/bible-study.entity';
import { UserRole } from '../../entities/user.entity';
import { CreateBibleStudyDto } from './dto/create-bible-study.dto';
import { UpdateBibleStudyDto } from './dto/update-bible-study.dto';
import { GenerateExplanationDto } from './dto/generate-explanation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChurchTenantGuard } from '../../common/guards/church-tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('bible-studies')
@UseGuards(JwtAuthGuard, RolesGuard, ChurchTenantGuard)
export class BibleStudyController {
  constructor(private readonly bibleStudyService: BibleStudyService) {}

  @Get()
  async findAll(@Request() req): Promise<BibleStudy[]> {
    const { churchId } = req.user;
    return this.bibleStudyService.findAll(churchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<BibleStudy> {
    const { churchId } = req.user;
    return this.bibleStudyService.findOne(id, churchId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PASTOR, UserRole.MEMBER)
  async create(@Body() createBibleStudyDto: CreateBibleStudyDto, @Request() req): Promise<BibleStudy> {
    const { id: userId, churchId } = req.user;
    
    // Set the churchId and authorId based on the authenticated user
    createBibleStudyDto.churchId = churchId;
    createBibleStudyDto.authorId = userId;
    
    return this.bibleStudyService.create(createBibleStudyDto, userId, churchId);
  }

  @Post(':id/ai-explanations')
  @Roles(UserRole.ADMIN, UserRole.PASTOR, UserRole.MEMBER)
  async generateAiExplanations(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() generateExplanationDto: GenerateExplanationDto,
    @Request() req
  ): Promise<BibleStudy> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the Bible study to verify ownership
    const bibleStudy = await this.bibleStudyService.findOne(id, churchId);
    
    // Verify ownership or proper role
    const isOwner = bibleStudy.authorId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only generate explanations for your own Bible studies');
    }
    
    // For non-admin users, check subscription
    if (role !== UserRole.ADMIN) {
      const church = await this.bibleStudyService.getChurchWithSubscription(churchId);
      
      // Check if church has AI explanation privileges based on subscription
      if (church.subscriptionPlan === 'free') {
        throw new ForbiddenException('AI explanations require a paid subscription');
      }
    }
    
    return this.bibleStudyService.generateAiExplanations(id, generateExplanationDto.bibleVerses, churchId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBibleStudyDto: UpdateBibleStudyDto,
    @Request() req,
  ): Promise<BibleStudy> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the Bible study to verify ownership
    const bibleStudy = await this.bibleStudyService.findOne(id, churchId);
    
    // Verify ownership or proper role
    const isOwner = bibleStudy.authorId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only update your own Bible studies');
    }
    
    return this.bibleStudyService.update(id, updateBibleStudyDto, churchId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: BibleStudyStatus,
    @Request() req,
  ): Promise<BibleStudy> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the Bible study to verify ownership and access rights
    const bibleStudy = await this.bibleStudyService.findOne(id, churchId);
    
    // For publishing, only pastors or admins can change status
    if (status === BibleStudyStatus.PUBLISHED && role !== UserRole.PASTOR && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only pastors or admins can publish Bible studies');
    }
    
    // Check if user is the author or has elevated permissions
    const isOwner = bibleStudy.authorId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only update the status of your own Bible studies');
    }
    
    return this.bibleStudyService.updateStatus(id, status, churchId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    const { id: userId, churchId, role } = req.user;
    
    // Get the Bible study to verify ownership
    const bibleStudy = await this.bibleStudyService.findOne(id, churchId);
    
    // Check if user has permission to delete
    const isOwner = bibleStudy.authorId === userId;
    const isPastorOrAdmin = role === UserRole.PASTOR || role === UserRole.ADMIN;
    
    if (!isOwner && !isPastorOrAdmin) {
      throw new ForbiddenException('You can only delete your own Bible studies');
    }
    
    return this.bibleStudyService.remove(id, churchId);
  }
}
