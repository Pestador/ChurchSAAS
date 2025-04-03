import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChurchesService } from './churches.service';
import { Church } from '../../entities/church.entity';

@Controller('churches')
export class ChurchesController {
  constructor(private readonly churchesService: ChurchesService) {}

  @Get()
  async findAll(): Promise<Church[]> {
    return this.churchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Church> {
    return this.churchesService.findOne(id);
  }

  @Post()
  async create(@Body() createChurchDto: any): Promise<Church> {
    return this.churchesService.create(createChurchDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateChurchDto: any): Promise<Church> {
    return this.churchesService.update(id, updateChurchDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.churchesService.remove(id);
  }
}
