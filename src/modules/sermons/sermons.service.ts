import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sermon, SermonStatus } from '../../entities/sermon.entity';
import { Church } from '../../entities/church.entity';
import { OpenAIService } from '../../services/openai.service';
import { ElevenLabsService, VoiceGender, VoiceAccent, VoiceStyle } from '../../services/elevenlabs.service';
import { GenerateSermonDto } from './dto/generate-sermon.dto';
import { CreateSermonDto } from './dto/create-sermon.dto';
import { UpdateSermonDto } from './dto/update-sermon.dto';
import { GenerateTTSDto } from './dto/generate-tts.dto';

@Injectable()
export class SermonsService {
  private readonly logger = new Logger(SermonsService.name);

  constructor(
    @InjectRepository(Sermon)
    private sermonsRepository: Repository<Sermon>,
    @InjectRepository(Church)
    private churchesRepository: Repository<Church>,
    private readonly openAIService: OpenAIService,
    private readonly elevenLabsService: ElevenLabsService,
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
      
      // Generate sermon content using OpenAI service with enhanced parameters
      const generatedSermon = await this.openAIService.generateSermon({
        title: generateSermonDto.title,
        theme: generateSermonDto.theme,
        bibleVerses: generateSermonDto.bibleVerses,
        audience: generateSermonDto.audience,
        length: generateSermonDto.length,
        style: generateSermonDto.style,
        denomination: generateSermonDto.denomination,
        theologicalFramework: generateSermonDto.theologicalFramework,
        includeIllustrations: generateSermonDto.includeIllustrations,
        includeApplicationPoints: generateSermonDto.includeApplicationPoints,
        includeClosingPrayer: generateSermonDto.includeClosingPrayer,
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

  async generateSermonSpeech(sermonId: string, ttsOptions: GenerateTTSDto, churchId: string) {
    try {
      this.logger.log(`Generating TTS for sermon ${sermonId}`);
      
      // Check if Eleven Labs API key is configured
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new BadRequestException('Eleven Labs API key is not configured');
      }
      
      // Find the sermon
      const sermon = await this.findOne(sermonId, churchId);
      
      // Check if the sermon already has audio
      if (sermon.audioUrl) {
        this.logger.log(`Sermon ${sermonId} already has audio at ${sermon.audioUrl}`);
      }
      
      // Extract text content from markdown
      const textContent = this.extractPlainTextFromMarkdown(sermon.content);
      
      // Generate TTS
      const ttsResponse = await this.elevenLabsService.generateSpeech(textContent, {
        voiceId: ttsOptions.voiceId,
        gender: ttsOptions.gender,
        accent: ttsOptions.accent,
        style: ttsOptions.style,
        stability: ttsOptions.stability,
        similarity_boost: ttsOptions.similarity_boost,
        modelId: ttsOptions.modelId,
      });
      
      // Update sermon with audio URL
      sermon.audioUrl = ttsResponse.audioUrl;
      sermon.audioDuration = ttsResponse.durationSeconds;
      
      // Save the sermon
      await this.sermonsRepository.save(sermon);
      
      this.logger.log(`Successfully generated TTS for sermon ${sermonId}: ${ttsResponse.audioUrl}`);
      
      return {
        sermon,
        audio: ttsResponse,
      };
    } catch (error) {
      this.logger.error(`Error generating TTS for sermon: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate sermon speech: ${error.message}`);
    }
  }
  
  async generateTextSpeech(text: string, ttsOptions: GenerateTTSDto, churchId: string) {
    try {
      this.logger.log(`Generating TTS for text snippet (${text.length} chars)`);
      
      // Check if Eleven Labs API key is configured
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new BadRequestException('Eleven Labs API key is not configured');
      }
      
      // Check if the church exists and has an active subscription
      await this.getChurchWithSubscription(churchId);
      
      // Generate TTS
      const ttsResponse = await this.elevenLabsService.generateSpeech(text, {
        voiceId: ttsOptions.voiceId,
        gender: ttsOptions.gender,
        accent: ttsOptions.accent,
        style: ttsOptions.style,
        stability: ttsOptions.stability,
        similarity_boost: ttsOptions.similarity_boost,
        modelId: ttsOptions.modelId,
      });
      
      this.logger.log(`Successfully generated TTS for text snippet: ${ttsResponse.audioUrl}`);
      
      return ttsResponse;
    } catch (error) {
      this.logger.error(`Error generating TTS for text: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate speech: ${error.message}`);
    }
  }
  
  async getChurchWithSubscription(churchId: string): Promise<Church> {
    const church = await this.churchesRepository.findOne({ where: { id: churchId } });
    
    if (!church) {
      throw new NotFoundException(`Church with ID ${churchId} not found`);
    }
    
    return church;
  }
  
  private extractPlainTextFromMarkdown(markdown: string): string {
    return markdown
      // Remove headers
      .replace(/#+\s+/g, '')
      // Remove bold/italic
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '')
      // Remove links but keep text
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      // Remove blockquotes
      .replace(/^\s*>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^\s*[-*_]{3,}\s*$/gm, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      // Trim
      .trim();
  }

  async remove(id: string, churchId: string): Promise<void> {
    const sermon = await this.findOne(id, churchId);
    await this.sermonsRepository.remove(sermon);
  }
}
