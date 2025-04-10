import { Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Church, SubscriptionPlan } from '../../entities/church.entity';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';

@Injectable()
export class ChurchesService {
  constructor(
    @InjectRepository(Church)
    private churchesRepository: Repository<Church>,
  ) {}

  async findAll(): Promise<Church[]> {
    return this.churchesRepository.find({ 
      relations: ['users'],
      order: { name: 'ASC' } 
    });
  }
  
  async findAllByIds(ids: string[]): Promise<Church[]> {
    return this.churchesRepository.find({
      where: { id: In(ids) },
      relations: ['users'],
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Church> {
    const church = await this.churchesRepository.findOne({ where: { id } });
    if (!church) {
      throw new NotFoundException(`Church with ID ${id} not found`);
    }
    return church;
  }

  async findByName(name: string): Promise<Church> {
    return this.churchesRepository.findOne({ where: { name } });
  }

  async create(createChurchDto: CreateChurchDto): Promise<Church> {
    // Check if church name already exists
    const existingChurch = await this.findByName(createChurchDto.name);
    if (existingChurch) {
      throw new ConflictException('Church name already exists');
    }

    try {
      const newChurch = this.churchesRepository.create({
        ...createChurchDto,
        subscriptionPlan: SubscriptionPlan.FREE, // Default to free plan
      });
      return await this.churchesRepository.save(newChurch);
    } catch (error) {
      throw new InternalServerErrorException('Error creating church');
    }
  }

  async update(id: string, updateChurchDto: UpdateChurchDto): Promise<Church> {
    const church = await this.findOne(id); // findOne checks existence

    // Optional: Add checks if sensitive fields like email are being changed and might conflict
    if (updateChurchDto.email && updateChurchDto.email !== church.email) {
      const existing = await this.churchesRepository.findOne({ where: { email: updateChurchDto.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already used by another church');
      }
    }

    Object.assign(church, updateChurchDto);

    try {
      return await this.churchesRepository.save(church);
    } catch (error) {
      // Handle potential conflicts or other DB errors during update
      if (error.code === '23505') { // Example: unique constraint violation
        throw new ConflictException('Update violates a unique constraint (e.g., email)');
      } else {
        throw new InternalServerErrorException('Error updating church');
      }
    }
  }

  async updateSubscription(id: string, plan: SubscriptionPlan, stripeData?: any): Promise<Church> {
    // Check if church exists
    const church = await this.findOne(id);

    // Update subscription details
    church.subscriptionPlan = plan;
    
    if (stripeData) {
      church.stripeCustomerId = stripeData.customerId || church.stripeCustomerId;
      church.stripeSubscriptionId = stripeData.subscriptionId || church.stripeSubscriptionId;
    }

    return this.churchesRepository.save(church);
  }

  async remove(id: string): Promise<void> {
    const church = await this.findOne(id); // Ensure church exists before attempting removal
    await this.churchesRepository.remove(church);
    // Consider soft delete if needed: await this.churchesRepository.softRemove(church);
  }
}
