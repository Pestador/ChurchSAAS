import { Test, TestingModule } from '@nestjs/testing';
import { BibleStudyController } from './bible-study.controller';
import { BibleStudyService } from './bible-study.service';
import { BibleStudy, BibleStudyStatus } from '../../entities/bible-study.entity';
import { UserRole } from '../../entities/user.entity';
import { Church, SubscriptionPlan } from '../../entities/church.entity';
import { ForbiddenException } from '@nestjs/common';
import { CreateBibleStudyDto } from './dto/create-bible-study.dto';
import { UpdateBibleStudyDto } from './dto/update-bible-study.dto';
import { GenerateExplanationDto, ExplanationDepth, ExplanationStyle } from './dto/generate-explanation.dto';

describe('BibleStudyController', () => {
  let controller: BibleStudyController;
  let bibleStudyService: BibleStudyService;

  // Mock data
  const mockBibleStudies = [
    {
      id: '1',
      title: 'Understanding Romans',
      description: 'A deep dive into Paul\'s letter to the Romans',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['Romans 8:28', 'Romans 12:1-2'],
      status: BibleStudyStatus.PUBLISHED,
      authorId: '2', // Pastor
      churchId: '1',
      isAiGenerated: false,
      aiGeneratedExplanations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BibleStudy,
    {
      id: '2',
      title: 'The Beatitudes',
      description: 'Exploring the teachings of Jesus',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['Matthew 5:3-12'],
      status: BibleStudyStatus.DRAFT,
      authorId: '2', // Pastor
      churchId: '1',
      isAiGenerated: false,
      aiGeneratedExplanations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BibleStudy,
    {
      id: '3',
      title: 'Fruits of the Spirit',
      description: 'Understanding Galatians 5',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['Galatians 5:22-23'],
      status: BibleStudyStatus.DRAFT,
      authorId: '3', // Member
      churchId: '1',
      isAiGenerated: false,
      aiGeneratedExplanations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BibleStudy,
    {
      id: '4',
      title: 'Another Church Bible Study',
      description: 'This belongs to a different church',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      bibleVerses: ['John 3:16'],
      status: BibleStudyStatus.PUBLISHED,
      authorId: '4', // Different church pastor
      churchId: '2',
      isAiGenerated: false,
      aiGeneratedExplanations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BibleStudy,
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

  // Mock BibleStudyService
  const mockBibleStudyService = {
    findAll: jest.fn().mockImplementation((churchId) => 
      Promise.resolve(mockBibleStudies.filter(study => study.churchId === churchId))
    ),
    findOne: jest.fn().mockImplementation((id, churchId) => {
      const study = mockBibleStudies.find(s => s.id === id && s.churchId === churchId);
      if (!study) {
        return Promise.reject(new Error('Bible study not found'));
      }
      return Promise.resolve(study);
    }),
    create: jest.fn().mockImplementation((createBibleStudyDto) => {
      const newStudy = {
        id: '5',
        ...createBibleStudyDto,
        status: BibleStudyStatus.DRAFT,
        isAiGenerated: false,
        aiGeneratedExplanations: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(newStudy as BibleStudy);
    }),
    update: jest.fn().mockImplementation((id, updateBibleStudyDto, churchId) => {
      const study = mockBibleStudies.find(s => s.id === id && s.churchId === churchId);
      if (!study) {
        return Promise.reject(new Error('Bible study not found'));
      }
      return Promise.resolve({
        ...study,
        ...updateBibleStudyDto,
        updatedAt: new Date(),
      } as BibleStudy);
    }),
    updateStatus: jest.fn().mockImplementation((id, status, churchId) => {
      const study = mockBibleStudies.find(s => s.id === id && s.churchId === churchId);
      if (!study) {
        return Promise.reject(new Error('Bible study not found'));
      }
      return Promise.resolve({
        ...study,
        status,
        updatedAt: new Date(),
      } as BibleStudy);
    }),
    getChurchWithSubscription: jest.fn().mockImplementation((churchId) => {
      const church = mockChurches.find(c => c.id === churchId);
      if (!church) {
        return Promise.reject(new Error('Church not found'));
      }
      return Promise.resolve(church);
    }),
    generateAiExplanations: jest.fn().mockImplementation((id, verses, churchId) => {
      const study = mockBibleStudies.find(s => s.id === id && s.churchId === churchId);
      if (!study) {
        return Promise.reject(new Error('Bible study not found'));
      }
      
      // Create a simple AI explanation for each verse
      const aiGeneratedExplanations = verses.reduce((acc, verse) => {
        acc[verse] = 'This is an AI-generated explanation for ' + verse;
        return acc;
      }, {});
      
      return Promise.resolve({
        ...study,
        aiGeneratedExplanations,
        updatedAt: new Date(),
      } as BibleStudy);
    }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BibleStudyController],
      providers: [
        {
          provide: BibleStudyService,
          useValue: mockBibleStudyService,
        },
      ],
    }).compile();

    controller = module.get<BibleStudyController>(BibleStudyController);
    bibleStudyService = module.get<BibleStudyService>(BibleStudyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all bible studies for a church', async () => {
      const churchId = '1';
      const req = { user: { churchId } };
      
      const result = await controller.findAll(req);
      
      expect(result).toHaveLength(3); // 3 bible studies belong to church 1
      expect(bibleStudyService.findAll).toHaveBeenCalledWith(churchId);
    });
  });

  describe('findOne', () => {
    it('should return a bible study by id for the user\'s church', async () => {
      const studyId = '1';
      const churchId = '1';
      const req = { user: { churchId } };
      
      const result = await controller.findOne(studyId, req);
      
      expect(result.id).toEqual(studyId);
      expect(bibleStudyService.findOne).toHaveBeenCalledWith(studyId, churchId);
    });

    it('should throw an error when bible study is not found', async () => {
      const studyId = 'nonexistent';
      const churchId = '1';
      const req = { user: { churchId } };
      
      jest.spyOn(bibleStudyService, 'findOne').mockRejectedValueOnce(new Error('Bible study not found'));
      
      await expect(controller.findOne(studyId, req)).rejects.toThrow('Bible study not found');
    });
  });

  describe('create', () => {
    it('should allow user to create a bible study', async () => {
      const createBibleStudyDto: CreateBibleStudyDto = {
        title: 'New Bible Study',
        content: 'This is new bible study content',
        bibleVerses: ['John 1:1'],
        authorId: '3',
        churchId: '1',
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      const result = await controller.create(createBibleStudyDto, req);
      
      expect(result.title).toEqual(createBibleStudyDto.title);
      expect(result.authorId).toEqual(req.user.id);
      expect(result.churchId).toEqual(req.user.churchId);
      expect(bibleStudyService.create).toHaveBeenCalledWith(createBibleStudyDto, req.user.id, req.user.churchId);
    });

    it('should set churchId and authorId from the authenticated user', async () => {
      const createBibleStudyDto: CreateBibleStudyDto = {
        title: 'New Bible Study',
        content: 'This is new bible study content',
        bibleVerses: ['John 1:1'],
        authorId: 'wrong-author-id', // This should be overwritten
        churchId: 'wrong-church-id', // This should be overwritten
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await controller.create(createBibleStudyDto, req);
      
      // DTO should be updated with correct IDs
      expect(createBibleStudyDto.authorId).toEqual(req.user.id);
      expect(createBibleStudyDto.churchId).toEqual(req.user.churchId);
    });
  });

  describe('generateAiExplanations', () => {
    it('should allow owner to generate AI explanations with premium subscription', async () => {
      const studyId = '3'; // Member's study
      const generateExplanationDto: GenerateExplanationDto = {
        bibleVerses: ['Galatians 5:22-23', 'Galatians 5:24-25'],
        depth: ExplanationDepth.DETAILED,
        style: ExplanationStyle.DEVOTIONAL,
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      const result = await controller.generateAiExplanations(studyId, generateExplanationDto, req);
      
      expect(result.aiGeneratedExplanations).toBeDefined();
      expect(Object.keys(result.aiGeneratedExplanations).length).toEqual(generateExplanationDto.bibleVerses.length);
      expect(bibleStudyService.generateAiExplanations).toHaveBeenCalledWith(
        studyId, 
        generateExplanationDto.bibleVerses, 
        req.user.churchId
      );
    });

    it('should allow pastors to generate AI explanations for any study in their church', async () => {
      const studyId = '3'; // Member's study
      const generateExplanationDto: GenerateExplanationDto = {
        bibleVerses: ['Galatians 5:22-23'],
      };
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      const result = await controller.generateAiExplanations(studyId, generateExplanationDto, req);
      
      expect(result.aiGeneratedExplanations).toBeDefined();
      expect(bibleStudyService.generateAiExplanations).toHaveBeenCalled();
    });

    it('should not allow users to generate AI explanations for studies they did not create', async () => {
      const studyId = '1'; // Pastor's study
      const generateExplanationDto: GenerateExplanationDto = {
        bibleVerses: ['Romans 8:28'],
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.generateAiExplanations(studyId, generateExplanationDto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should not allow users with free subscription to generate AI explanations', async () => {
      const studyId = '4'; // Different church's study
      const generateExplanationDto: GenerateExplanationDto = {
        bibleVerses: ['John 3:16'],
      };
      const req = { user: { id: '4', churchId: '2', role: UserRole.PASTOR } };
      
      // Mock the church with free subscription
      jest.spyOn(bibleStudyService, 'getChurchWithSubscription').mockResolvedValueOnce({
        id: '2',
        name: 'Second Church',
        subscriptionPlan: SubscriptionPlan.FREE,
      } as Church);
      
      await expect(controller.generateAiExplanations(studyId, generateExplanationDto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admins to generate AI explanations regardless of subscription', async () => {
      const studyId = '4'; // Different church's study
      const generateExplanationDto: GenerateExplanationDto = {
        bibleVerses: ['John 3:16'],
      };
      const req = { user: { id: '1', churchId: '2', role: UserRole.ADMIN } };
      
      const result = await controller.generateAiExplanations(studyId, generateExplanationDto, req);
      
      expect(result.aiGeneratedExplanations).toBeDefined();
      // Verify that subscription check was not called
      expect(bibleStudyService.getChurchWithSubscription).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should allow author to update their bible study', async () => {
      const studyId = '3'; // Member's study
      const updateBibleStudyDto: UpdateBibleStudyDto = {
        title: 'Updated Bible Study Title',
        description: 'Updated description',
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      const result = await controller.update(studyId, updateBibleStudyDto, req);
      
      expect(result.title).toEqual(updateBibleStudyDto.title);
      expect(bibleStudyService.update).toHaveBeenCalledWith(studyId, updateBibleStudyDto, req.user.churchId);
    });

    it('should allow pastors to update any bible study in their church', async () => {
      const studyId = '3'; // Member's study
      const updateBibleStudyDto: UpdateBibleStudyDto = {
        title: 'Pastor Updated Bible Study',
      };
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      const result = await controller.update(studyId, updateBibleStudyDto, req);
      
      expect(result.title).toEqual(updateBibleStudyDto.title);
      expect(bibleStudyService.update).toHaveBeenCalledWith(studyId, updateBibleStudyDto, req.user.churchId);
    });

    it('should not allow members to update bible studies they did not author', async () => {
      const studyId = '1'; // Pastor's study
      const updateBibleStudyDto: UpdateBibleStudyDto = {
        title: 'Member Trying to Update',
      };
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.update(studyId, updateBibleStudyDto, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should allow pastor to publish a bible study', async () => {
      const studyId = '2'; // Draft study
      const newStatus = BibleStudyStatus.PUBLISHED;
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      const result = await controller.updateStatus(studyId, newStatus, req);
      
      expect(result.status).toEqual(newStatus);
      expect(bibleStudyService.updateStatus).toHaveBeenCalledWith(studyId, newStatus, req.user.churchId);
    });

    it('should allow author to change status to draft', async () => {
      const studyId = '3'; // Member's study
      const newStatus = BibleStudyStatus.ARCHIVED;
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      const result = await controller.updateStatus(studyId, newStatus, req);
      
      expect(result.status).toEqual(newStatus);
      expect(bibleStudyService.updateStatus).toHaveBeenCalledWith(studyId, newStatus, req.user.churchId);
    });

    it('should not allow regular members to publish bible studies', async () => {
      const studyId = '3'; // Member's study
      const newStatus = BibleStudyStatus.PUBLISHED;
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.updateStatus(studyId, newStatus, req)).rejects.toThrow(ForbiddenException);
    });

    it('should not allow members to update status of studies they did not author', async () => {
      const studyId = '1'; // Pastor's study
      const newStatus = BibleStudyStatus.ARCHIVED;
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.updateStatus(studyId, newStatus, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow author to delete their bible study', async () => {
      const studyId = '3'; // Member's study
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await controller.remove(studyId, req);
      
      expect(bibleStudyService.remove).toHaveBeenCalledWith(studyId, req.user.churchId);
    });

    it('should allow pastors to delete any bible study in their church', async () => {
      const studyId = '3'; // Member's study
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      await controller.remove(studyId, req);
      
      expect(bibleStudyService.remove).toHaveBeenCalledWith(studyId, req.user.churchId);
    });

    it('should not allow members to delete bible studies they did not author', async () => {
      const studyId = '1'; // Pastor's study
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.remove(studyId, req)).rejects.toThrow(ForbiddenException);
    });
  });
});
