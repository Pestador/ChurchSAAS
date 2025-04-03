import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrayerRequest, PrayerRequestStatus, PrayerRequestVisibility } from '../../entities/prayer-request.entity';

@Injectable()
export class PrayerRequestsService {
  constructor(
    @InjectRepository(PrayerRequest)
    private prayerRequestRepository: Repository<PrayerRequest>,
  ) {}

  async findAll(churchId: string, userId?: string, visibility?: PrayerRequestVisibility): Promise<PrayerRequest[]> {
    // Base query conditions
    const queryConditions: any = { churchId };
    
    // Add visibility filter if provided
    if (visibility) {
      queryConditions.visibility = visibility;
    } else {
      // If no specific visibility requested, apply default visibility rules
      // Users can see their own prayer requests + all public ones
      if (userId) {
        return this.prayerRequestRepository.find({
          where: [
            { churchId, userId }, // User's own prayers
            { churchId, visibility: PrayerRequestVisibility.PUBLIC }, // Public prayers
          ],
          relations: ['user', 'church'],
          order: { createdAt: 'DESC' },
        });
      }
    }
    
    return this.prayerRequestRepository.find({
      where: queryConditions,
      relations: ['user', 'church'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, churchId: string, userId?: string): Promise<PrayerRequest> {
    // Find the prayer request
    const prayerRequest = await this.prayerRequestRepository.findOne({
      where: { id, churchId },
      relations: ['user', 'church'],
    });
    
    if (!prayerRequest) {
      throw new NotFoundException(`Prayer request with ID ${id} not found`);
    }
    
    // Check visibility permissions
    // Admin users (checked in the controller) can see all
    // Regular users can only see their own private prayers or public ones
    if (
      userId &&
      userId !== prayerRequest.userId &&
      prayerRequest.visibility === PrayerRequestVisibility.PRIVATE
    ) {
      throw new NotFoundException(`Prayer request with ID ${id} not found or not accessible`);
    }
    
    return prayerRequest;
  }

  async create(createPrayerRequestDto: any, userId: string, churchId: string): Promise<PrayerRequest> {
    const newPrayerRequest = this.prayerRequestRepository.create({
      ...createPrayerRequestDto,
      userId,
      churchId,
    });

    return this.prayerRequestRepository.save(newPrayerRequest);
  }

  async update(id: string, updatePrayerRequestDto: any, churchId: string, userId: string): Promise<PrayerRequest> {
    // Check if prayer request exists and is accessible by the user
    const prayerRequest = await this.findOne(id, churchId);
    
    // Only the author should be able to update their prayer request
    // Admin users (checked in the controller) can update any
    if (userId !== prayerRequest.userId) {
      throw new NotFoundException(`Prayer request with ID ${id} not found or not accessible`);
    }
    
    // Update prayer request
    await this.prayerRequestRepository.update({ id, churchId }, updatePrayerRequestDto);
    return this.findOne(id, churchId);
  }

  async updateStatus(id: string, status: PrayerRequestStatus, churchId: string): Promise<PrayerRequest> {
    // Check if prayer request exists
    const prayerRequest = await this.findOne(id, churchId);
    
    // Update status
    prayerRequest.status = status;
    
    return this.prayerRequestRepository.save(prayerRequest);
  }

  async incrementPrayerCount(id: string, churchId: string): Promise<PrayerRequest> {
    // Check if prayer request exists
    const prayerRequest = await this.findOne(id, churchId);
    
    // Increment prayer count
    prayerRequest.prayerCount += 1;
    
    return this.prayerRequestRepository.save(prayerRequest);
  }

  async addAiResponse(id: string, churchId: string): Promise<PrayerRequest> {
    // This is a placeholder for AI response generation logic
    // In a real implementation, this would call the OpenAI API
    
    // Find the prayer request
    const prayerRequest = await this.findOne(id, churchId);
    
    // Generate AI response
    prayerRequest.aiResponse = 'This is an AI-generated response to your prayer request. Content will be replaced with actual AI-generated text.';
    
    // Generate related Bible verses
    prayerRequest.relatedBibleVerses = ['John 3:16', 'Psalm 23:1'];
    
    return this.prayerRequestRepository.save(prayerRequest);
  }

  async remove(id: string, churchId: string, userId: string): Promise<void> {
    // Check if prayer request exists and is accessible by the user
    const prayerRequest = await this.findOne(id, churchId);
    
    // Only the author should be able to delete their prayer request
    // Admin users (checked in the controller) can delete any
    if (userId !== prayerRequest.userId) {
      throw new NotFoundException(`Prayer request with ID ${id} not found or not accessible`);
    }
    
    await this.prayerRequestRepository.remove(prayerRequest);
  }
}
