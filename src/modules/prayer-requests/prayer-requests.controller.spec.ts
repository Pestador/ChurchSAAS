import { Test, TestingModule } from '@nestjs/testing';
import { PrayerRequestsController } from './prayer-requests.controller';
import { PrayerRequestsService } from './prayer-requests.service';
import { PrayerRequest, PrayerRequestStatus, PrayerRequestVisibility } from '../../entities/prayer-request.entity';
import { UserRole } from '../../entities/user.entity';
import { Church, SubscriptionPlan } from '../../entities/church.entity';
import { ForbiddenException } from '@nestjs/common';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
import { UpdatePrayerRequestDto } from './dto/update-prayer-request.dto';

describe('PrayerRequestsController', () => {
  let controller: PrayerRequestsController;
  let prayerRequestsService: PrayerRequestsService;

  // Mock data
  const mockPrayerRequests = [
    {
      id: '1',
      title: 'Health Concern',
      content: 'Please pray for my upcoming surgery',
      status: PrayerRequestStatus.OPEN,
      visibility: PrayerRequestVisibility.PUBLIC,
      userId: '3', // Member
      churchId: '1',
      relatedBibleVerses: ['Psalm 23:4'],
      aiResponse: null,
      prayerCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PrayerRequest,
    {
      id: '2',
      title: 'Family Issue',
      content: 'Need prayers for a private family matter',
      status: PrayerRequestStatus.OPEN,
      visibility: PrayerRequestVisibility.PRIVATE,
      userId: '3', // Member
      churchId: '1',
      relatedBibleVerses: [],
      aiResponse: null,
      prayerCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PrayerRequest,
    {
      id: '3',
      title: 'Pastoral Guidance',
      content: 'Need spiritual guidance on a personal matter',
      status: PrayerRequestStatus.OPEN,
      visibility: PrayerRequestVisibility.PASTORAL,
      userId: '3', // Member
      churchId: '1',
      relatedBibleVerses: [],
      aiResponse: null,
      prayerCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PrayerRequest,
    {
      id: '4',
      title: 'Answered Prayer',
      content: 'My job interview went well, thank you for your prayers',
      status: PrayerRequestStatus.ANSWERED,
      visibility: PrayerRequestVisibility.PUBLIC,
      userId: '2', // Pastor
      churchId: '1',
      relatedBibleVerses: ['Philippians 4:6-7'],
      aiResponse: 'This is an AI-generated response for the answered prayer.',
      prayerCount: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PrayerRequest,
    {
      id: '5',
      title: 'Different Church Prayer',
      content: 'This prayer request belongs to another church',
      status: PrayerRequestStatus.OPEN,
      visibility: PrayerRequestVisibility.PUBLIC,
      userId: '4', // Different church user
      churchId: '2',
      relatedBibleVerses: [],
      aiResponse: null,
      prayerCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PrayerRequest,
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

  // Mock PrayerRequestsService
  const mockPrayerRequestsService = {
    findAll: jest.fn().mockImplementation((churchId, userId, role, status, visibility) => {
      let filteredRequests = mockPrayerRequests.filter(pr => pr.churchId === churchId);
      
      // Apply filters if provided
      if (status) {
        filteredRequests = filteredRequests.filter(pr => pr.status === status);
      }
      
      if (visibility) {
        filteredRequests = filteredRequests.filter(pr => pr.visibility === visibility);
      }
      
      // Handle visibility permissions based on role
      if (role !== UserRole.ADMIN && role !== UserRole.PASTOR) {
        // Regular members can only see public prayers and their own private prayers
        filteredRequests = filteredRequests.filter(pr => 
          pr.visibility === PrayerRequestVisibility.PUBLIC || 
          (pr.userId === userId && pr.visibility === PrayerRequestVisibility.PRIVATE)
        );
      }
      
      return Promise.resolve(filteredRequests);
    }),
    findOne: jest.fn().mockImplementation((id, churchId, userId, role) => {
      const prayerRequest = mockPrayerRequests.find(pr => pr.id === id && pr.churchId === churchId);
      if (!prayerRequest) {
        return Promise.reject(new Error('Prayer request not found'));
      }
      
      // Check visibility permissions
      if (role !== UserRole.ADMIN && role !== UserRole.PASTOR) {
        if (prayerRequest.visibility === PrayerRequestVisibility.PASTORAL || 
            (prayerRequest.visibility === PrayerRequestVisibility.PRIVATE && prayerRequest.userId !== userId)) {
          return Promise.reject(new Error('You do not have permission to view this prayer request'));
        }
      }
      
      return Promise.resolve(prayerRequest);
    }),
    create: jest.fn().mockImplementation((createPrayerRequestDto, userId, churchId) => {
      const newPrayerRequest = {
        id: '6',
        ...createPrayerRequestDto,
        status: PrayerRequestStatus.OPEN,
        userId,
        churchId,
        prayerCount: 0,
        aiResponse: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(newPrayerRequest as PrayerRequest);
    }),
    addAiResponse: jest.fn().mockImplementation((id, churchId) => {
      const prayerRequest = mockPrayerRequests.find(pr => pr.id === id && pr.churchId === churchId);
      if (!prayerRequest) {
        return Promise.reject(new Error('Prayer request not found'));
      }
      return Promise.resolve({
        ...prayerRequest,
        aiResponse: 'This is an AI-generated response for the prayer request.',
        updatedAt: new Date(),
      } as PrayerRequest);
    }),
    incrementPrayerCount: jest.fn().mockImplementation((id, churchId) => {
      const prayerRequest = mockPrayerRequests.find(pr => pr.id === id && pr.churchId === churchId);
      if (!prayerRequest) {
        return Promise.reject(new Error('Prayer request not found'));
      }
      return Promise.resolve({
        ...prayerRequest,
        prayerCount: prayerRequest.prayerCount + 1,
        updatedAt: new Date(),
      } as PrayerRequest);
    }),
    update: jest.fn().mockImplementation((id, updatePrayerRequestDto, userId, churchId) => {
      const prayerRequest = mockPrayerRequests.find(pr => pr.id === id && pr.churchId === churchId);
      if (!prayerRequest) {
        return Promise.reject(new Error('Prayer request not found'));
      }
      return Promise.resolve({
        ...prayerRequest,
        ...updatePrayerRequestDto,
        updatedAt: new Date(),
      } as PrayerRequest);
    }),
    updateStatus: jest.fn().mockImplementation((id, status, churchId) => {
      const prayerRequest = mockPrayerRequests.find(pr => pr.id === id && pr.churchId === churchId);
      if (!prayerRequest) {
        return Promise.reject(new Error('Prayer request not found'));
      }
      return Promise.resolve({
        ...prayerRequest,
        status,
        updatedAt: new Date(),
      } as PrayerRequest);
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
      controllers: [PrayerRequestsController],
      providers: [
        {
          provide: PrayerRequestsService,
          useValue: mockPrayerRequestsService,
        },
      ],
    }).compile();

    controller = module.get<PrayerRequestsController>(PrayerRequestsController);
    prayerRequestsService = module.get<PrayerRequestsService>(PrayerRequestsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all prayer requests for pastor', async () => {
      const churchId = '1';
      const userId = '2';
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      const result = await controller.findAll(req);
      
      expect(result).toHaveLength(4); // 4 prayer requests in church 1
      expect(prayerRequestsService.findAll).toHaveBeenCalledWith(churchId, userId, UserRole.PASTOR, undefined, undefined);
    });

    it('should filter by status when provided', async () => {
      const churchId = '1';
      const userId = '2';
      const status = PrayerRequestStatus.ANSWERED;
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      const result = await controller.findAll(req, status);
      
      expect(result.every(pr => pr.status === status)).toBeTruthy();
      expect(prayerRequestsService.findAll).toHaveBeenCalledWith(churchId, userId, UserRole.PASTOR, status, undefined);
    });

    it('should filter by visibility when provided', async () => {
      const churchId = '1';
      const userId = '2';
      const visibility = PrayerRequestVisibility.PUBLIC;
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      const result = await controller.findAll(req, undefined, visibility);
      
      expect(result.every(pr => pr.visibility === visibility)).toBeTruthy();
      expect(prayerRequestsService.findAll).toHaveBeenCalledWith(churchId, userId, UserRole.PASTOR, undefined, visibility);
    });

    it('should restrict members from seeing pastoral requests', async () => {
      const churchId = '1';
      const userId = '3'; // Member
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      const result = await controller.findAll(req);
      
      // Member should not see pastoral requests
      expect(result.some(pr => pr.visibility === PrayerRequestVisibility.PASTORAL)).toBeFalsy();
    });
  });

  describe('findOne', () => {
    it('should allow pastor to view any prayer request', async () => {
      const prayerRequestId = '3'; // Pastoral visibility
      const churchId = '1';
      const userId = '2'; // Pastor
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      const result = await controller.findOne(prayerRequestId, req);
      
      expect(result.id).toEqual(prayerRequestId);
      expect(prayerRequestsService.findOne).toHaveBeenCalledWith(prayerRequestId, churchId, userId, UserRole.PASTOR);
    });

    it('should allow member to view their own private request', async () => {
      const prayerRequestId = '2'; // Private visibility, created by member
      const churchId = '1';
      const userId = '3'; // Member who created it
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      const result = await controller.findOne(prayerRequestId, req);
      
      expect(result.id).toEqual(prayerRequestId);
    });

    it('should reject member access to pastoral requests', async () => {
      const prayerRequestId = '3'; // Pastoral visibility
      const churchId = '1';
      const userId = '3'; // Member
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      // Mock service to throw permission error
      jest.spyOn(prayerRequestsService, 'findOne').mockRejectedValueOnce(
        new Error('You do not have permission to view this prayer request')
      );
      
      await expect(controller.findOne(prayerRequestId, req)).rejects.toThrow(
        'You do not have permission to view this prayer request'
      );
    });
  });

  describe('create', () => {
    it('should allow member to create a prayer request', async () => {
      const createPrayerRequestDto: CreatePrayerRequestDto = {
        title: 'New Prayer Request',
        content: 'Please pray for me',
        visibility: PrayerRequestVisibility.PUBLIC,
        relatedBibleVerses: ['Psalm 121:1-2'],
        userId: '', // Should be overwritten
        churchId: '', // Should be overwritten
      };
      const userId = '3'; // Member
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      const result = await controller.create(createPrayerRequestDto, req);
      
      expect(result.title).toEqual(createPrayerRequestDto.title);
      expect(createPrayerRequestDto.userId).toEqual(userId); // Should be set by controller
      expect(createPrayerRequestDto.churchId).toEqual(churchId); // Should be set by controller
      expect(prayerRequestsService.create).toHaveBeenCalledWith(createPrayerRequestDto, userId, churchId);
    });
  });

  describe('generateAiResponse', () => {
    it('should allow pastor to generate AI response with premium subscription', async () => {
      const prayerRequestId = '1';
      const churchId = '1';
      const userId = '2'; // Pastor
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      const result = await controller.generateAiResponse(prayerRequestId, req);
      
      expect(result.aiResponse).toBeDefined();
      expect(prayerRequestsService.addAiResponse).toHaveBeenCalledWith(prayerRequestId, churchId);
    });

    it('should not allow pastor to generate AI response with free subscription', async () => {
      const prayerRequestId = '5'; // From church 2 (free subscription)
      const churchId = '2';
      const userId = '4'; // Pastor from church 2
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      await expect(controller.generateAiResponse(prayerRequestId, req)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to generate AI response regardless of subscription', async () => {
      const prayerRequestId = '5'; // From church 2 (free subscription)
      const churchId = '2';
      const userId = '1'; // Admin
      const req = { user: { id: userId, churchId, role: UserRole.ADMIN } };
      
      const result = await controller.generateAiResponse(prayerRequestId, req);
      
      expect(result.aiResponse).toBeDefined();
      // Verify that subscription check was not called for admin
      expect(prayerRequestsService.getChurchWithSubscription).not.toHaveBeenCalled();
    });
  });

  describe('pray (increment prayer count)', () => {
    it('should increment the prayer count', async () => {
      const prayerRequestId = '1';
      const churchId = '1';
      const req = { user: { churchId } };
      
      const initialCount = mockPrayerRequests[0].prayerCount;
      const result = await controller.pray(prayerRequestId, req);
      
      expect(result.prayerCount).toEqual(initialCount + 1);
      expect(prayerRequestsService.incrementPrayerCount).toHaveBeenCalledWith(prayerRequestId, churchId);
    });
  });

  describe('update', () => {
    it('should allow user to update their own prayer request', async () => {
      const prayerRequestId = '1'; // Member's prayer request
      const updatePrayerRequestDto: UpdatePrayerRequestDto = {
        title: 'Updated Prayer Request',
        content: 'Updated content',
      };
      const userId = '3'; // Member who created it
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      const result = await controller.update(prayerRequestId, updatePrayerRequestDto, req);
      
      expect(result.title).toEqual(updatePrayerRequestDto.title);
      expect(prayerRequestsService.update).toHaveBeenCalledWith(prayerRequestId, updatePrayerRequestDto, userId, churchId);
    });

    it('should allow pastor to update any prayer request in their church', async () => {
      const prayerRequestId = '1'; // Member's prayer request
      const updatePrayerRequestDto: UpdatePrayerRequestDto = {
        title: 'Pastor Updated',
        content: 'Pastor updated content',
      };
      const userId = '2'; // Pastor
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      const result = await controller.update(prayerRequestId, updatePrayerRequestDto, req);
      
      expect(result.title).toEqual(updatePrayerRequestDto.title);
      expect(prayerRequestsService.update).toHaveBeenCalledWith(prayerRequestId, updatePrayerRequestDto, userId, churchId);
    });

    it('should not allow member to update prayer requests they did not create', async () => {
      const prayerRequestId = '4'; // Pastor's prayer request
      const updatePrayerRequestDto: UpdatePrayerRequestDto = {
        title: 'Member Trying to Update',
      };
      const userId = '3'; // Member
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      // Mock service to return prayer request
      jest.spyOn(prayerRequestsService, 'findOne').mockResolvedValueOnce({
        ...mockPrayerRequests[3], // Pastor's prayer request
        userId: '2', // Pastor is creator, not the member trying to update
      } as PrayerRequest);
      
      await expect(controller.update(prayerRequestId, updatePrayerRequestDto, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should allow user to update status of their own prayer request', async () => {
      const prayerRequestId = '1'; // Member's prayer request
      const newStatus = PrayerRequestStatus.ANSWERED;
      const userId = '3'; // Member who created it
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      // Mock service to return prayer request
      jest.spyOn(prayerRequestsService, 'findOne').mockResolvedValueOnce({
        ...mockPrayerRequests[0],
        userId, // Ensuring the user is the creator
      } as PrayerRequest);
      
      const result = await controller.updateStatus(prayerRequestId, newStatus, req);
      
      expect(result.status).toEqual(newStatus);
      expect(prayerRequestsService.updateStatus).toHaveBeenCalledWith(prayerRequestId, newStatus, churchId);
    });

    it('should allow pastor to update status of any prayer request', async () => {
      const prayerRequestId = '1'; // Member's prayer request
      const newStatus = PrayerRequestStatus.CLOSED;
      const userId = '2'; // Pastor
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      const result = await controller.updateStatus(prayerRequestId, newStatus, req);
      
      expect(result.status).toEqual(newStatus);
      expect(prayerRequestsService.updateStatus).toHaveBeenCalledWith(prayerRequestId, newStatus, churchId);
    });
  });

  describe('remove', () => {
    it('should allow user to delete their own prayer request', async () => {
      const prayerRequestId = '1'; // Member's prayer request
      const userId = '3'; // Member who created it
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      // Mock service to return prayer request
      jest.spyOn(prayerRequestsService, 'findOne').mockResolvedValueOnce({
        ...mockPrayerRequests[0],
        userId, // Ensuring the user is the creator
      } as PrayerRequest);
      
      await controller.remove(prayerRequestId, req);
      
      expect(prayerRequestsService.remove).toHaveBeenCalledWith(prayerRequestId, userId, churchId);
    });

    it('should allow pastor to delete any prayer request in their church', async () => {
      const prayerRequestId = '1'; // Member's prayer request
      const userId = '2'; // Pastor
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.PASTOR } };
      
      await controller.remove(prayerRequestId, req);
      
      expect(prayerRequestsService.remove).toHaveBeenCalledWith(prayerRequestId, userId, churchId);
    });

    it('should not allow member to delete prayer requests they did not create', async () => {
      const prayerRequestId = '4'; // Pastor's prayer request
      const userId = '3'; // Member
      const churchId = '1';
      const req = { user: { id: userId, churchId, role: UserRole.MEMBER } };
      
      // Mock service to return prayer request
      jest.spyOn(prayerRequestsService, 'findOne').mockResolvedValueOnce({
        ...mockPrayerRequests[3], // Pastor's prayer request
        userId: '2', // Pastor is creator, not the member trying to delete
      } as PrayerRequest);
      
      await expect(controller.remove(prayerRequestId, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('incrementPrayerCount', () => {
    it('should increment the prayer count', async () => {
      const prayerRequestId = '1';
      const churchId = '1';
      const req = { user: { churchId } };
      
      const initialCount = mockPrayerRequests[0].prayerCount;
      const result = await controller.incrementPrayerCount(prayerRequestId, req);
      
      expect(result.prayerCount).toEqual(initialCount + 1);
      expect(prayerRequestsService.incrementPrayerCount).toHaveBeenCalledWith(prayerRequestId, churchId);
    });
  });
});
