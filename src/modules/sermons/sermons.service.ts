import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sermon, SermonStatus } from '../../entities/sermon.entity';
import { Church } from '../../entities/church.entity';
import { OpenAIService } from '../../services/openai.service';
import { GenerateSermonDto } from './dto/generate-sermon.dto';
import { CreateSermonDto } from './dto/create-sermon.dto';
import { UpdateSermonDto } from './dto/update-sermon.dto';

@Injectable()
export class SermonsService {
  private readonly logger = new Logger(SermonsService.name);

  constructor(
    @InjectRepository(Sermon)
    private sermonsRepository: Repository<Sermon>,
    @InjectRepository(Church)
    private churchesRepository: Repository<Church>,
    private readonly openAIService: OpenAIService,
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

  async create(createSermonDto: CreateSermonDto, userId: string, churchId: string): Promise<Sermon> {
    const newSermon = this.sermonsRepository.create({
      ...createSermonDto,
      authorId: userId,
      churchId,
    });

    return this.sermonsRepository.save(newSermon);
  }

  async update(id: string, updateSermonDto: UpdateSermonDto, churchId: string): Promise<Sermon> {
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

  async generateAiSermon(generateSermonDto: GenerateSermonDto, userId: string, churchId: string): Promise<Sermon> {
    try {
      this.logger.log(`Generating AI sermon for church ${churchId}`);      
      
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new BadRequestException('OpenAI API key is not configured');
      }
      
      // Generate sermon content using OpenAI service
      const generatedSermon = await this.openAIService.generateSermon({
        title: generateSermonDto.title,
        theme: generateSermonDto.theme,
        bibleVerses: generateSermonDto.bibleVerses,
        audience: generateSermonDto.audience,
        length: generateSermonDto.length,
        style: generateSermonDto.style,
        additionalInstructions: generateSermonDto.additionalInstructions,
      });
      
      // Extract a short description from the content
      let description = '';
      const contentLines = generatedSermon.content.split('\n');
      // Skip title line if it exists and look for first paragraph
      const startIndex = contentLines[0].startsWith('#') ? 1 : 0;
      for (let i = startIndex; i < contentLines.length; i++) {
        const line = contentLines[i].trim();
        if (line && !line.startsWith('#')) {
          description = line.substring(0, 500);
          break;
        }
      }
      
      // Create a sermon from the AI-generated content
      const newSermon = this.sermonsRepository.create({
        title: generatedSermon.title,
        content: generatedSermon.content,
        description: description,
        bibleVerses: generateSermonDto.bibleVerses || [],
        theme: generateSermonDto.theme,
        isAiGenerated: true,
        aiPrompt: generateSermonDto, // Store the original prompt data
        authorId: userId,
        churchId,
        status: SermonStatus.DRAFT,
      });

      const savedSermon = await this.sermonsRepository.save(newSermon);
      this.logger.log(`Successfully generated AI sermon with ID ${savedSermon.id}`);
      return savedSermon;
    } catch (error) {
      this.logger.error(`Error generating AI sermon: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate sermon: ${error.message}`);
    }
  }

  async getChurchWithSubscription(churchId: string): Promise<Church> {
    const church = await this.churchesRepository.findOne({ where: { id: churchId } });
    
    if (!church) {
      throw new NotFoundException(`Church with ID ${churchId} not found`);
    }
    
    return church;
  }
  
  async remove(id: string, churchId: string): Promise<void> {
    const sermon = await this.findOne(id, churchId);
    await this.sermonsRepository.remove(sermon);
  }
}
