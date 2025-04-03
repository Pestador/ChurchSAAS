import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BibleStudyService } from './bible-study.service';
import { BibleStudy, BibleStudyStatus } from '../../entities/bible-study.entity';

@Controller('bible-studies')
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
  async create(@Body() createBibleStudyDto: any, @Request() req): Promise<BibleStudy> {
    const { id: userId, churchId } = req.user;
    return this.bibleStudyService.create(createBibleStudyDto, userId, churchId);
  }

  @Post(':id/ai-explanations')
  async generateAiExplanations(
    @Param('id') id: string, 
    @Body('verses') verses: string[],
    @Request() req
  ): Promise<BibleStudy> {
    const { churchId } = req.user;
    return this.bibleStudyService.generateAiExplanations(id, verses, churchId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBibleStudyDto: any,
    @Request() req,
  ): Promise<BibleStudy> {
    const { churchId } = req.user;
    return this.bibleStudyService.update(id, updateBibleStudyDto, churchId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BibleStudyStatus,
    @Request() req,
  ): Promise<BibleStudy> {
    const { churchId } = req.user;
    return this.bibleStudyService.updateStatus(id, status, churchId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const { churchId } = req.user;
    return this.bibleStudyService.remove(id, churchId);
  }
}
