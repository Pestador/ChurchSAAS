import { Test, TestingModule } from '@nestjs/testing';
import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';
import { Church, SubscriptionPlan } from '../../entities/church.entity';
import { UserRole } from '../../entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';

describe('ChurchesController', () => {
  let controller: ChurchesController;
  let churchesService: ChurchesService;

  // Mock data
  const mockChurches = [
    {
      id: '1',
      name: 'First Church',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      phoneNumber: '555-123-4567',
      websiteUrl: 'https://firstchurch.com',
      email: 'info@firstchurch.com',
      description: 'A welcoming community church',
      logoUrl: 'https://example.com/logo1.png',
      subscriptionPlan: SubscriptionPlan.PREMIUM,
      stripeCustomerId: 'cust_123',
      stripeSubscriptionId: 'sub_123',
      createdAt: new Date(),
      updatedAt: new Date(),
      country: 'USA',
      isActive: true,
      isVerified: true,
    } as Church,
    {
      id: '2',
      name: 'Second Church',
      address: '456 Oak St',
      city: 'Othertown',
      state: 'NY',
      zipCode: '67890',
      phoneNumber: '555-987-6543',
      websiteUrl: 'https://secondchurch.com',
      email: 'info@secondchurch.com',
      description: 'A vibrant faith community',
      logoUrl: 'https://example.com/logo2.png',
      subscriptionPlan: SubscriptionPlan.BASIC,
      stripeCustomerId: 'cust_456',
      stripeSubscriptionId: 'sub_456',
      createdAt: new Date(),
      updatedAt: new Date(),
      country: 'USA',
      isActive: true,
      isVerified: true,
    } as Church,
  ];

  // Mock ChurchesService
  const mockChurchesService = {
    findAll: jest.fn().mockResolvedValue(mockChurches),
    findAllByIds: jest.fn().mockImplementation((ids) => 
      Promise.resolve(mockChurches.filter(church => ids.includes(church.id)))
    ),
    findOne: jest.fn().mockImplementation((id) => 
      Promise.resolve(mockChurches.find(church => church.id === id))
    ),
    create: jest.fn().mockImplementation((createChurchDto) => {
      const newChurch = {
        id: '3',
        ...createChurchDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(newChurch as Church);
    }),
    update: jest.fn().mockImplementation((id, updateChurchDto) => {
      const church = mockChurches.find(church => church.id === id);
      if (!church) {
        return Promise.reject(new Error('Church not found'));
      }
      return Promise.resolve({
        ...church,
        ...updateChurchDto,
        updatedAt: new Date(),
      });
    }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChurchesController],
      providers: [
        {
          provide: ChurchesService,
          useValue: mockChurchesService,
        },
      ],
    }).compile();

    controller = module.get<ChurchesController>(ChurchesController);
    churchesService = module.get<ChurchesService>(ChurchesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all churches for admin', async () => {
      const req = { user: { role: UserRole.ADMIN } };
      
      const result = await controller.findAll(req);
      
      expect(result).toEqual(mockChurches);
      expect(churchesService.findAll).toHaveBeenCalled();
      expect(churchesService.findAllByIds).not.toHaveBeenCalled();
    });

    it('should return only user church for non-admin users', async () => {
      const churchId = '1';
      const req = { user: { role: UserRole.PASTOR, churchId } };
      
      // Reset the mock to clear previous calls
      jest.clearAllMocks();
      
      const result = await controller.findAll(req);
      
      expect(result).toEqual([mockChurches[0]]);
      // Check that findAllByIds was called with the right parameters
      expect(churchesService.findAllByIds).toHaveBeenCalledWith([churchId]);
    });
  });

  describe('findOne', () => {
    it('should allow admin to find any church', async () => {
      const churchId = '2';
      const req = { user: { role: UserRole.ADMIN } };
      
      const result = await controller.findOne(churchId, req);
      
      expect(result).toEqual(mockChurches[1]);
      expect(churchesService.findOne).toHaveBeenCalledWith(churchId);
    });

    it('should allow users to find their own church', async () => {
      const churchId = '1';
      const req = { user: { role: UserRole.PASTOR, churchId } };
      
      const result = await controller.findOne(churchId, req);
      
      expect(result).toEqual(mockChurches[0]);
      expect(churchesService.findOne).toHaveBeenCalledWith(churchId);
    });

    it('should not allow users to find other churches', async () => {
      const churchId = '2';
      const req = { user: { role: UserRole.PASTOR, churchId: '1' } };
      
      await expect(controller.findOne(churchId, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should allow admin to create a church', async () => {
      const createChurchDto: CreateChurchDto = {
        name: 'New Church',
        address: '789 Pine St',
        city: 'Newtown',
        state: 'TX',
        zipCode: '54321',
        phoneNumber: '555-111-2222',
        email: 'info@newchurch.com',
      };
      
      const result = await controller.create(createChurchDto);
      
      expect(result.name).toEqual(createChurchDto.name);
      expect(churchesService.create).toHaveBeenCalledWith(createChurchDto);
    });
  });

  describe('update', () => {
    it('should allow admin to update any church', async () => {
      const churchId = '2';
      const updateChurchDto: UpdateChurchDto = {
        name: 'Updated Church',
        subscriptionPlan: SubscriptionPlan.PREMIUM,
      };
      const req = { user: { role: UserRole.ADMIN } };
      
      const result = await controller.update(churchId, updateChurchDto, req);
      
      expect(result.name).toEqual(updateChurchDto.name);
      expect(churchesService.update).toHaveBeenCalledWith(churchId, updateChurchDto);
    });

    it('should allow pastor to update their own church', async () => {
      const churchId = '1';
      const updateChurchDto: UpdateChurchDto = {
        name: 'Updated Church',
        description: 'New description',
      };
      const req = { user: { role: UserRole.PASTOR, churchId } };
      
      const result = await controller.update(churchId, updateChurchDto, req);
      
      expect(result.name).toEqual(updateChurchDto.name);
      expect(churchesService.update).toHaveBeenCalledWith(churchId, updateChurchDto);
    });

    it('should not allow pastor to update other churches', async () => {
      const churchId = '2';
      const updateChurchDto: UpdateChurchDto = {
        name: 'Updated Church',
      };
      const req = { user: { role: UserRole.PASTOR, churchId: '1' } };
      
      await expect(controller.update(churchId, updateChurchDto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should not allow pastor to update subscription fields', async () => {
      const churchId = '1';
      const updateChurchDto: UpdateChurchDto = {
        name: 'Updated Church',
        subscriptionPlan: SubscriptionPlan.PREMIUM,
      };
      const req = { user: { role: UserRole.PASTOR, churchId } };
      
      await expect(controller.update(churchId, updateChurchDto, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow admin to delete a church', async () => {
      const churchId = '2';
      
      await controller.remove(churchId);
      
      expect(churchesService.remove).toHaveBeenCalledWith(churchId);
    });
  });
});
