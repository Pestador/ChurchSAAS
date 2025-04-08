import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BibleStudy, BibleStudyStatus } from '../../entities/bible-study.entity';
import { Church } from '../../entities/church.entity';
import { CreateBibleStudyDto } from './dto/create-bible-study.dto';
import { UpdateBibleStudyDto } from './dto/update-bible-study.dto';
import { OpenAIService } from '../../services/openai.service';
import { GenerateExplanationDto } from './dto/generate-explanation.dto';

@Injectable()
export class BibleStudyService {
  private readonly logger = new Logger(BibleStudyService.name);
  
  constructor(
    @InjectRepository(BibleStudy)
    private bibleStudyRepository: Repository<BibleStudy>,
    @InjectRepository(Church)
    private churchesRepository: Repository<Church>,
    private readonly openAIService: OpenAIService,
  ) {}

  async findAll(churchId: string): Promise<BibleStudy[]> {
    return this.bibleStudyRepository.find({ 
      where: { churchId },
      relations: ['author', 'church'],
      order: { createdAt: 'DESC' } 
    });
  }

  async findOne(id: string, churchId: string): Promise<BibleStudy> {
    const bibleStudy = await this.bibleStudyRepository.findOne({ 
      where: { id, churchId },
      relations: ['author', 'church'] 
    });
    if (!bibleStudy) {
      throw new NotFoundException(`Bible study with ID ${id} not found`);
    }
    return bibleStudy;
  }

  async create(createBibleStudyDto: CreateBibleStudyDto, userId: string, churchId: string): Promise<BibleStudy> {
    const newBibleStudy = this.bibleStudyRepository.create({
      ...createBibleStudyDto,
      authorId: userId,
      churchId,
    });

    return this.bibleStudyRepository.save(newBibleStudy);
  }

  async update(id: string, updateBibleStudyDto: UpdateBibleStudyDto, churchId: string): Promise<BibleStudy> {
    // Check if bible study exists
    await this.findOne(id, churchId);

    // Update bible study
    await this.bibleStudyRepository.update({ id, churchId }, updateBibleStudyDto);
    return this.findOne(id, churchId);
  }

  async updateStatus(id: string, status: BibleStudyStatus, churchId: string): Promise<BibleStudy> {
    // Check if bible study exists
    const bibleStudy = await this.findOne(id, churchId);
    
    // Update status
    bibleStudy.status = status;
    
    return this.bibleStudyRepository.save(bibleStudy);
  }

  async getChurchWithSubscription(churchId: string): Promise<Church> {
    this.logger.log(`Getting church with subscription for church ID ${churchId}`);
    
    const church = await this.churchesRepository.findOne({ where: { id: churchId } });
    
    if (!church) {
      throw new NotFoundException(`Church with ID ${churchId} not found`);
    }
    
    return church;
  }

  async generateAiExplanations(id: string, verses: string[], churchId: string, options?: Partial<GenerateExplanationDto>): Promise<BibleStudy> {
    this.logger.log(`Generating AI explanations for Bible study ${id} in church ${churchId}`);
    
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new BadRequestException('OpenAI API key is not configured');
      }
      
      // Find the Bible study
      const bibleStudy = await this.findOne(id, churchId);
      
      // Get the church for denomination information
      const church = await this.getChurchWithSubscription(churchId);
      
      // Map ExplanationDepth and ExplanationStyle to the format expected by the OpenAI service
      let depth: 'basic' | 'detailed' | 'academic' = 'detailed';
      if (options?.depth === 'BASIC') depth = 'basic';
      else if (options?.depth === 'DETAILED') depth = 'detailed';
      
      let style: 'devotional' | 'educational' | 'practical' = 'educational';
      if (options?.style === 'DEVOTIONAL') style = 'devotional';
      else if (options?.style === 'PASTORAL') style = 'practical';
      else if (options?.style === 'ACADEMIC') style = 'educational';
      
      // Call OpenAI service to generate explanations
      const explanations = await this.openAIService.generateBibleExplanation(verses, {
        depth,
        style,
        includeHistoricalContext: true,
        includeCrossReferences: true,
        includeApplicationPoints: true,
        targetAudience: options?.targetAudience,
        context: options?.context,
      });
      
      // Add AI-generated explanations to the Bible study
      bibleStudy.aiGeneratedExplanations = {
        ...bibleStudy.aiGeneratedExplanations,
        ...explanations
      };

      const savedBibleStudy = await this.bibleStudyRepository.save(bibleStudy);
      this.logger.log(`Successfully generated AI explanations for Bible study ${id}`);
      return savedBibleStudy;
    } catch (error) {
      this.logger.error(`Error generating AI explanations: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate explanations: ${error.message}`);
    }
  }

  async remove(id: string, churchId: string): Promise<void> {
    const bibleStudy = await this.findOne(id, churchId);
    await this.bibleStudyRepository.remove(bibleStudy);
  }
}
