import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sermon, SermonStatus } from '../../entities/sermon.entity';

@Injectable()
export class SermonsService {
  constructor(
    @InjectRepository(Sermon)
    private sermonsRepository: Repository<Sermon>,
  ) {}

  async findAll(churchId: string): Promise<Sermon[]> {
    return this.sermonsRepository.find({ 
      where: { churchId },
      relations: ['author', 'church'],
      order: { createdAt: 'DESC' } 
    });
  }

  async findOne(id: string, churchId: string): Promise<Sermon> {
    const sermon = await this.sermonsRepository.findOne({ 
      where: { id, churchId },
      relations: ['author', 'church'] 
    });
    if (!sermon) {
      throw new NotFoundException(`Sermon with ID ${id} not found`);
    }
    return sermon;
  }

  async create(createSermonDto: any, userId: string, churchId: string): Promise<Sermon> {
    const newSermon = this.sermonsRepository.create({
      ...createSermonDto,
      authorId: userId,
      churchId,
    });

    return this.sermonsRepository.save(newSermon);
  }

  async update(id: string, updateSermonDto: any, churchId: string): Promise<Sermon> {
    // Check if sermon exists
    await this.findOne(id, churchId);

    // Update sermon
    await this.sermonsRepository.update({ id, churchId }, updateSermonDto);
    return this.findOne(id, churchId);
  }

  async updateStatus(id: string, status: SermonStatus, churchId: string): Promise<Sermon> {
    // Check if sermon exists
    const sermon = await this.findOne(id, churchId);
    
    // Update status
    sermon.status = status;
    
    return this.sermonsRepository.save(sermon);
  }

  async generateAiSermon(aiPromptData: any, userId: string, churchId: string): Promise<Sermon> {
    // This is a placeholder for AI sermon generation logic
    // In a real implementation, this would call the OpenAI API
    
    // Create a sermon from the AI-generated content
    const newSermon = this.sermonsRepository.create({
      title: aiPromptData.title || 'AI Generated Sermon',
      content: 'This sermon was generated by AI. Content will be replaced with actual AI-generated text.',
      bibleVerses: aiPromptData.bibleVerses || [],
      theme: aiPromptData.theme,
      isAiGenerated: true,
      aiPrompt: aiPromptData,
      authorId: userId,
      churchId,
      status: SermonStatus.DRAFT,
    });

    return this.sermonsRepository.save(newSermon);
  }

  async remove(id: string, churchId: string): Promise<void> {
    const sermon = await this.findOne(id, churchId);
    await this.sermonsRepository.remove(sermon);
  }
}
