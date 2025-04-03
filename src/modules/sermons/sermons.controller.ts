import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SermonsService } from './sermons.service';
import { Sermon, SermonStatus } from '../../entities/sermon.entity';

@Controller('sermons')
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
  async create(@Body() createSermonDto: any, @Request() req): Promise<Sermon> {
    const { id: userId, churchId } = req.user;
    return this.sermonsService.create(createSermonDto, userId, churchId);
  }

  @Post('ai-generate')
  async generateAiSermon(@Body() aiPromptData: any, @Request() req): Promise<Sermon> {
    const { id: userId, churchId } = req.user;
    return this.sermonsService.generateAiSermon(aiPromptData, userId, churchId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSermonDto: any,
    @Request() req,
  ): Promise<Sermon> {
    const { churchId } = req.user;
    return this.sermonsService.update(id, updateSermonDto, churchId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SermonStatus,
    @Request() req,
  ): Promise<Sermon> {
    const { churchId } = req.user;
    return this.sermonsService.updateStatus(id, status, churchId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const { churchId } = req.user;
    return this.sermonsService.remove(id, churchId);
  }
}
