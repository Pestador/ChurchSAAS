import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Req,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { FlaggedContentDto } from './dto/flagged-content.dto';
import { ContentFlagSeverity } from '../../services/content-moderation.service';

interface RequestWithUser {
  user: {
    userId: string;
    churchId: string;
    role: UserRole;
  };
}

@Controller('api/v1/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModerationController {
  private readonly logger = new Logger(ModerationController.name);

  constructor(private readonly moderationService: ModerationService) {}

  /**
   * Get all flagged content with filtering options
   * Only church admins and the platform admin can access
   */
  @Get('flagged')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async getFlaggedContent(
    @Req() req: RequestWithUser,
    @Query('resolved') resolved?: boolean,
    @Query('severity') severity?: ContentFlagSeverity,
    @Query('contentType') contentType?: string,
  ) {
    this.logger.debug(`Getting flagged content for church ${req.user.churchId}`);
    return this.moderationService.getFlaggedContent(
      req.user.churchId,
      resolved,
      severity,
      contentType,
    );
  }

  /**
   * Get moderation statistics
   * Only church admins and the platform admin can access
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async getModerationStats(@Req() req: RequestWithUser) {
    return this.moderationService.getModerationStats(req.user.churchId);
  }

  /**
   * Get a specific flagged content item
   */
  @Get('flagged/:id')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async getFlaggedContentById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.moderationService.getFlaggedContentById(id, req.user.churchId);
  }

  /**
   * Check content before submission
   * This endpoint can be used by the frontend to check content
   * before submitting forms
   */
  @Post('check')
  async checkContent(
    @Body() body: { content: string },
    @Req() req: RequestWithUser,
  ) {
    const isAllowed = await this.moderationService.checkContent(body.content);
    return { isAllowed };
  }

  /**
   * Manually flag content for review
   */
  @Post('flag')
  @Roles(UserRole.ADMIN, UserRole.PASTOR, UserRole.MEMBER)
  async flagContent(
    @Body() body: { contentType: string; contentId: string; content: string },
    @Req() req: RequestWithUser,
  ) {
    return this.moderationService.flagContent(
      body.contentType,
      body.contentId,
      body.content,
      req.user.churchId,
    );
  }

  /**
   * Review flagged content
   * Only church admins and platform admin can review
   */
  @Post('flagged/:id/review')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async reviewFlaggedContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reviewNotes: string; resolved: boolean },
    @Req() req: RequestWithUser,
  ) {
    return this.moderationService.reviewFlaggedContent(
      id,
      req.user.userId,
      body.reviewNotes,
      body.resolved,
      req.user.churchId,
    );
  }

  /**
   * Delete flagged content record
   * Only church admins and platform admin can delete
   */
  @Delete('flagged/:id')
  @Roles(UserRole.ADMIN, UserRole.PASTOR)
  async deleteFlaggedContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    await this.moderationService.deleteFlaggedContent(id, req.user.churchId);
    return { message: 'Flagged content record deleted successfully' };
  }
}
