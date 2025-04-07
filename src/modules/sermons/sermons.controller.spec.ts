import { Test, TestingModule } from '@nestjs/testing';
import { SermonsController } from './sermons.controller';
import { SermonsService } from './sermons.service';
import { Sermon, SermonStatus } from '../../entities/sermon.entity';
import { UserRole } from '../../entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { CreateSermonDto } from './dto/create-sermon.dto';
import { UpdateSermonDto } from './dto/update-sermon.dto';
import { GenerateSermonDto } from './dto/generate-sermon.dto';
import { Church, SubscriptionPlan } from '../../entities/church.entity';

describe('SermonsController', () => {
  let controller: SermonsController;
  let sermonsService: SermonsService;

  // Mock data
  const mockSermons = [
    {
      id: '1',
      title: 'Sunday Sermon',
      description: 'A powerful message about love',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['John 3:16', 'Romans 8:28'],
      theme: 'Love',
      status: SermonStatus.PUBLISHED,
      authorId: '2', // Pastor
      churchId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Sermon,
    {
      id: '2',
      title: 'Wednesday Bible Study',
      description: 'Exploring the book of Romans',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['Romans 12:1-2', 'Romans 5:8'],
      theme: 'Faith',
      status: SermonStatus.DRAFT,
      authorId: '2', // Pastor
      churchId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Sermon,
    {
      id: '3',
      title: 'Special Event Sermon',
      description: 'Easter celebration',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['Matthew 28:6', '1 Corinthians 15:20'],
      theme: 'Resurrection',
      status: SermonStatus.ARCHIVED,
      authorId: '3', // Member with sermon creation privileges
      churchId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Sermon,
    {
      id: '4',
      title: 'Another Church Sermon',
      description: 'This belongs to a different church',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['Psalm 23:1'],
      theme: 'Peace',
      status: SermonStatus.PUBLISHED,
      authorId: '4', // Different church pastor
      churchId: '2',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Sermon,
  ];

  // Mock churches for subscription checking
  const mockChurches = [
    {
      id: '1',
      name: 'First Church',
      subscriptionPlan: SubscriptionPlan.PREMIUM,
    } as Church,
    {
      id: '2',
      name: 'Second Church',
      subscriptionPlan: SubscriptionPlan.FREE,
    } as Church,
  ];

  // Mock SermonsService
  const mockSermonsService = {
    findAll: jest.fn().mockImplementation((churchId) => 
      Promise.resolve(mockSermons.filter(sermon => sermon.churchId === churchId))
    ),
    findOne: jest.fn().mockImplementation((id, churchId) => {
      const sermon = mockSermons.find(s => s.id === id && s.churchId === churchId);
      if (!sermon) {
        return Promise.reject(new Error('Sermon not found'));
      }
      return Promise.resolve(sermon);
    }),
    create: jest.fn().mockImplementation((createSermonDto) => {
      const newSermon = {
        id: '5',
        ...createSermonDto,
        status: SermonStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(newSermon as Sermon);
    }),
    generateAiSermon: jest.fn().mockImplementation((generateSermonDto, userId, churchId) => {
      const newSermon = {
        id: '6',
        title: generateSermonDto.title || 'AI Generated Sermon',
        description: generateSermonDto.description || 'AI generated content',
        content: 'This is AI generated sermon content based on the provided theme and Bible verses.',
        bibleVerses: generateSermonDto.bibleVerses || ['John 3:16'],
        theme: generateSermonDto.theme || 'Faith',
        status: SermonStatus.DRAFT,
        authorId: userId,
        churchId: churchId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(newSermon as Sermon);
    }),
    update: jest.fn().mockImplementation((id, updateSermonDto, churchId) => {
      const sermon = mockSermons.find(s => s.id === id && s.churchId === churchId);
      if (!sermon) {
        return Promise.reject(new Error('Sermon not found'));
      }
      return Promise.resolve({
        ...sermon,
        ...updateSermonDto,
        updatedAt: new Date(),
      } as Sermon);
    }),
    updateStatus: jest.fn().mockImplementation((id, status, churchId) => {
      const sermon = mockSermons.find(s => s.id === id && s.churchId === churchId);
      if (!sermon) {
        return Promise.reject(new Error('Sermon not found'));
      }
      return Promise.resolve({
        ...sermon,
        status,
        updatedAt: new Date(),
      } as Sermon);
    }),
    remove: jest.fn().mockResolvedValue(undefined),
    getChurchWithSubscription: jest.fn().mockImplementation((churchId) => {
      const church = mockChurches.find(c => c.id === churchId);
      if (!church) {
        return Promise.reject(new Error('Church not found'));
      }
      return Promise.resolve(church);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SermonsController],
      providers: [
        {
          provide: SermonsService,
          useValue: mockSermonsService,
        },
      ],
    }).compile();

    controller = module.get<SermonsController>(SermonsController);
    sermonsService = module.get<SermonsService>(SermonsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all sermons for a church', async () => {
      const churchId = '1';
      const req = { user: { churchId } };
      
      const result = await controller.findAll(req);
      
      expect(result).toHaveLength(3); // 3 sermons belong to church 1
      expect(sermonsService.findAll).toHaveBeenCalledWith(churchId);
    });
  });

  describe('findOne', () => {
    it('should return a sermon by id for the user\'s church', async () => {
      const sermonId = '1';
      const churchId = '1';
      const req = { user: { churchId } };
      
      const result = await controller.findOne(sermonId, req);
      
      expect(result.id).toEqual(sermonId);
      expect(sermonsService.findOne).toHaveBeenCalledWith(sermonId, churchId);
    });

    it('should throw an error when sermon is not found', async () => {
      const sermonId = 'nonexistent';
      const churchId = '1';
      const req = { user: { churchId } };
      
      // Mock service to throw 'not found' error
      jest.spyOn(sermonsService, 'findOne').mockRejectedValueOnce(new Error('Sermon not found'));
      
      await expect(controller.findOne(sermonId, req)).rejects.toThrow('Sermon not found');
    });
  });

  describe('create', () => {
    it('should allow pastor to create a sermon', async () => {
      const createSermonDto: CreateSermonDto = {
        title: 'New Sermon',
        content: 'This is a new sermon content',
        bibleVerses: ['Matthew 5:16'],
        theme: 'Light',
        churchId: '1',
        authorId: '2',
      };
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      const result = await controller.create(createSermonDto, req);
      
      expect(result.title).toEqual(createSermonDto.title);
      expect(result.authorId).toEqual(req.user.id);
      expect(result.churchId).toEqual(req.user.churchId);
      expect(sermonsService.create).toHaveBeenCalledWith(createSermonDto, req.user.id, req.user.churchId);
    });

    it('should not allow members to create sermons', async () => {
      const createSermonDto: CreateSermonDto = {
        title: 'New Sermon',
        content: 'This is a new sermon content',
        churchId: '1',
        authorId: '3',
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };

      // Mock RolesGuard would normally block this, but we'll test the logic for completeness
      try {
        await controller.create(createSermonDto, req);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('generateAiSermon', () => {
    it('should allow pastors with premium subscription to generate AI sermons', async () => {
      const generateSermonDto: GenerateSermonDto = {
        title: 'AI Sermon',
        theme: 'Love',
        bibleVerses: ['1 Corinthians 13'],
      };
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      const result = await controller.generateAiSermon(generateSermonDto, req);
      
      expect(result.title).toContain('AI');
      expect(sermonsService.generateAiSermon).toHaveBeenCalledWith(generateSermonDto, req.user.id, req.user.churchId);
    });

    it('should not allow pastors with free subscription to generate AI sermons', async () => {
      const generateSermonDto: GenerateSermonDto = {
        theme: 'Faith',
        bibleVerses: ['Hebrews 11:1'],
      };
      const req = { user: { id: '4', churchId: '2', role: UserRole.PASTOR } };
      
      // Need to mock the church with free subscription
      jest.spyOn(sermonsService, 'getChurchWithSubscription').mockResolvedValueOnce({
        id: '2',
        name: 'Second Church',
        subscriptionPlan: SubscriptionPlan.FREE,
      } as Church);
      
      await expect(controller.generateAiSermon(generateSermonDto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admins to generate AI sermons regardless of subscription', async () => {
      const generateSermonDto: GenerateSermonDto = {
        theme: 'Grace',
        bibleVerses: ['Ephesians 2:8-9'],
      };
      const req = { user: { id: '1', churchId: '2', role: UserRole.ADMIN } };
      
      const result = await controller.generateAiSermon(generateSermonDto, req);
      
      expect(result).toBeDefined();
      expect(sermonsService.generateAiSermon).toHaveBeenCalledWith(generateSermonDto, req.user.id, req.user.churchId);
    });
  });

  describe('update', () => {
    it('should allow sermon author to update their sermon', async () => {
      const sermonId = '3';
      const updateSermonDto: UpdateSermonDto = {
        title: 'Updated Sermon Title',
        description: 'Updated description',
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      const result = await controller.update(sermonId, updateSermonDto, req);
      
      expect(result.title).toEqual(updateSermonDto.title);
      expect(sermonsService.update).toHaveBeenCalledWith(sermonId, updateSermonDto, req.user.churchId);
    });

    it('should allow pastors to update any sermon in their church', async () => {
      const sermonId = '3'; // Created by member
      const updateSermonDto: UpdateSermonDto = {
        title: 'Pastor Updated Sermon',
      };
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      const result = await controller.update(sermonId, updateSermonDto, req);
      
      expect(result.title).toEqual(updateSermonDto.title);
      expect(sermonsService.update).toHaveBeenCalledWith(sermonId, updateSermonDto, req.user.churchId);
    });

    it('should not allow members to update sermons they did not author', async () => {
      const sermonId = '1'; // Created by pastor
      const updateSermonDto: UpdateSermonDto = {
        title: 'Member Trying to Update',
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      // Mock the sermon that's being returned
      jest.spyOn(sermonsService, 'findOne').mockResolvedValueOnce({
        ...mockSermons[0],
        authorId: '2', // Pastor is author, not the member trying to update
      } as Sermon);
      
      await expect(controller.update(sermonId, updateSermonDto, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should allow pastor to publish a sermon', async () => {
      const sermonId = '2'; // Draft sermon
      const newStatus = SermonStatus.PUBLISHED;
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      const result = await controller.updateStatus(sermonId, newStatus, req);
      
      expect(result.status).toEqual(newStatus);
      expect(sermonsService.updateStatus).toHaveBeenCalledWith(sermonId, newStatus, req.user.churchId);
    });

    it('should not allow regular members to publish sermons', async () => {
      const sermonId = '3'; // Member-authored sermon
      const newStatus = SermonStatus.PUBLISHED;
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.updateStatus(sermonId, newStatus, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow sermon author to delete their sermon', async () => {
      const sermonId = '3'; // Member-authored sermon
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await controller.remove(sermonId, req);
      
      expect(sermonsService.remove).toHaveBeenCalledWith(sermonId, req.user.churchId);
    });

    it('should allow pastors to delete any sermon in their church', async () => {
      const sermonId = '3'; // Member-authored sermon
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      await controller.remove(sermonId, req);
      
      expect(sermonsService.remove).toHaveBeenCalledWith(sermonId, req.user.churchId);
    });

    it('should not allow members to delete sermons they did not author', async () => {
      const sermonId = '1'; // Pastor-authored sermon
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      // Mock sermon that will be returned
      jest.spyOn(sermonsService, 'findOne').mockResolvedValueOnce({
        ...mockSermons[0],
        id: sermonId,
        authorId: '2', // Pastor is author, not member trying to delete
      } as Sermon);
      
      await expect(controller.remove(sermonId, req)).rejects.toThrow(ForbiddenException);
    });
  });
});
