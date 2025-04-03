import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Church, SubscriptionPlan } from '../../entities/church.entity';

@Injectable()
export class ChurchesService {
  constructor(
    @InjectRepository(Church)
    private churchesRepository: Repository<Church>,
  ) {}

  async findAll(): Promise<Church[]> {
    return this.churchesRepository.find();
  }

  async findOne(id: string): Promise<Church> {
    const church = await this.churchesRepository.findOne({ 
      where: { id },
      relations: ['users'] 
    });
    if (!church) {
      throw new NotFoundException(`Church with ID ${id} not found`);
    }
    return church;
  }

  async findByName(name: string): Promise<Church> {
    return this.churchesRepository.findOne({ where: { name } });
  }

  async create(createChurchDto: any): Promise<Church> {
    // Check if church name already exists
    const existingChurch = await this.findByName(createChurchDto.name);
    if (existingChurch) {
      throw new ConflictException('Church name already exists');
    }

    // Create new church
    const newChurch = this.churchesRepository.create({
      ...createChurchDto,
      subscriptionPlan: SubscriptionPlan.FREE, // Default to free plan
    });

    return this.churchesRepository.save(newChurch);
  }

  async update(id: string, updateChurchDto: any): Promise<Church> {
    // Check if church exists
    await this.findOne(id);

    // Update church
    await this.churchesRepository.update(id, updateChurchDto);
    return this.findOne(id);
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
    const church = await this.findOne(id);
    await this.churchesRepository.remove(church);
  }
}
