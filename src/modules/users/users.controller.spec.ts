import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserRole } from '../../entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  // Mock data
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@church.com',
      password: 'hashed_password',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      churchId: '1',
      avatarUrl: null,
      church: null as any,
      sermons: [],
      prayerRequests: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'pastor@church.com',
      password: 'hashed_password',
      firstName: 'Pastor',
      lastName: 'User',
      role: UserRole.PASTOR,
      churchId: '1',
      avatarUrl: null,
      church: null as any,
      sermons: [],
      prayerRequests: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      email: 'member@church.com',
      password: 'hashed_password',
      firstName: 'Member',
      lastName: 'User',
      role: UserRole.MEMBER,
      churchId: '1',
      avatarUrl: null,
      church: null as any,
      sermons: [],
      prayerRequests: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      email: 'member2@church.com',
      password: 'hashed_password',
      firstName: 'Member2',
      lastName: 'User',
      role: UserRole.MEMBER,
      churchId: '2',
      avatarUrl: null,
      church: null as any,
      sermons: [],
      prayerRequests: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Mock UsersService
  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue(mockUsers),
    findAllByChurch: jest.fn().mockImplementation((churchId) => 
      Promise.resolve(mockUsers.filter(user => user.churchId === churchId))
    ),
    findOne: jest.fn().mockImplementation((id) => 
      Promise.resolve(mockUsers.find(user => user.id === id))
    ),
    findOneInChurch: jest.fn().mockImplementation((id, churchId) => {
      const user = mockUsers.find(u => u.id === id && u.churchId === churchId);
      if (!user) {
        return Promise.reject(new Error('User not found'));
      }
      return Promise.resolve(user);
    }),
    create: jest.fn().mockImplementation((createUserDto) => {
      const newUser = {
        id: '5',
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(newUser);
    }),
    update: jest.fn().mockImplementation((id, updateUserDto) => {
      const user = mockUsers.find(user => user.id === id);
      if (!user) {
        return Promise.reject(new Error('User not found'));
      }
      return Promise.resolve({
        ...user,
        ...updateUserDto,
        updatedAt: new Date(),
      });
    }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users for admin', async () => {
      const req = { user: { churchId: '1', role: UserRole.ADMIN } };
      
      const result = await controller.findAll(req);
      
      expect(result).toEqual(mockUsers);
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.findAllByChurch).not.toHaveBeenCalled();
    });

    it('should return only church users for pastor', async () => {
      const churchId = '1';
      const req = { user: { churchId, role: UserRole.PASTOR } };
      const expectedUsers = mockUsers.filter(user => user.churchId === churchId);
      
      const result = await controller.findAll(req);
      
      expect(result).toEqual(expectedUsers);
      expect(usersService.findAll).not.toHaveBeenCalled();
      expect(usersService.findAllByChurch).toHaveBeenCalledWith(churchId);
    });
  });

  describe('findOne', () => {
    it('should allow user to find their own profile', async () => {
      const userId = '3';
      const req = { user: { id: userId, churchId: '1', role: UserRole.MEMBER } };
      
      const result = await controller.findOne(userId, req);
      
      expect(result).toEqual(mockUsers.find(user => user.id === userId));
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });

    it('should allow admin to find any user', async () => {
      const userId = '3';
      const req = { user: { id: '1', churchId: '1', role: UserRole.ADMIN } };
      
      const result = await controller.findOne(userId, req);
      
      expect(result).toEqual(mockUsers.find(user => user.id === userId));
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });

    it('should allow pastor to find users in their church', async () => {
      const userId = '3';
      const churchId = '1';
      const req = { user: { id: '2', churchId, role: UserRole.PASTOR } };
      
      const result = await controller.findOne(userId, req);
      
      expect(result).toEqual(mockUsers.find(user => user.id === userId));
      expect(usersService.findOneInChurch).toHaveBeenCalledWith(userId, churchId);
    });

    it('should not allow members to view other profiles', async () => {
      const userId = '2';
      const req = { user: { id: '3', churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.findOne(userId, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should allow admin to create any user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@church.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.PASTOR,
        churchId: '2',
      };
      const req = { user: { id: '1', churchId: '1', role: UserRole.ADMIN } };
      
      const result = await controller.create(createUserDto, req);
      
      expect(result.email).toEqual(createUserDto.email);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should allow pastor to create members in their church', async () => {
      const churchId = '1';
      const createUserDto: CreateUserDto = {
        email: 'newmember@church.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Member',
        role: UserRole.MEMBER,
        churchId,
      };
      const req = { user: { id: '2', churchId, role: UserRole.PASTOR } };
      
      const result = await controller.create(createUserDto, req);
      
      expect(result.email).toEqual(createUserDto.email);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should not allow pastor to create users in other churches', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newmember@church.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Member',
        role: UserRole.MEMBER,
        churchId: '2',
      };
      const req = { user: { id: '2', churchId: '1', role: UserRole.PASTOR } };
      
      await expect(controller.create(createUserDto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should not allow pastor to create other pastors or admins', async () => {
      const churchId = '1';
      const createUserDto: CreateUserDto = {
        email: 'newpastor@church.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Pastor',
        role: UserRole.PASTOR,
        churchId,
      };
      const req = { user: { id: '2', churchId, role: UserRole.PASTOR } };
      
      await expect(controller.create(createUserDto, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should allow user to update their own profile', async () => {
      const userId = '3';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Member',
      };
      const req = { user: { id: userId, churchId: '1', role: UserRole.MEMBER } };
      
      const result = await controller.update(userId, updateUserDto, req);
      
      expect(result.firstName).toEqual(updateUserDto.firstName);
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should not allow user to change their own role', async () => {
      const userId = '3';
      const updateUserDto: UpdateUserDto = {
        role: UserRole.PASTOR,
      };
      const req = { user: { id: userId, churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.update(userId, updateUserDto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any user', async () => {
      const userId = '3';
      const updateUserDto: UpdateUserDto = {
        role: UserRole.PASTOR,
      };
      const req = { user: { id: '1', churchId: '1', role: UserRole.ADMIN } };
      
      const result = await controller.update(userId, updateUserDto, req);
      
      expect(result.role).toEqual(updateUserDto.role);
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should allow admin to delete any user', async () => {
      const userId = '3';
      const req = { user: { id: '1', churchId: '1', role: UserRole.ADMIN } };
      
      await controller.remove(userId, req);
      
      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should allow pastor to delete members in their church', async () => {
      const userId = '3';
      const churchId = '1';
      
      // Mock findOne to return a specific user
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce({
        ...mockUsers[2], // member user
        id: userId,
        churchId,
      });
      
      const req = { user: { id: '2', churchId, role: UserRole.PASTOR } };
      
      await controller.remove(userId, req);
      
      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should not allow pastor to delete users in other churches', async () => {
      const userId = '4'; // Member in church 2
      const churchId = '1';
      
      // Mock findOne to return a user from a different church
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce({
        ...mockUsers[3], // member2 user
        id: userId,
        churchId: '2',
      });
      
      const req = { user: { id: '2', churchId, role: UserRole.PASTOR } };
      
      await expect(controller.remove(userId, req)).rejects.toThrow(ForbiddenException);
    });

    it('should not allow pastor to delete other pastors or admins', async () => {
      const userId = '2'; // Another pastor
      const churchId = '1';
      
      // Mock findOne to return a pastor user
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce({
        ...mockUsers[1], // pastor user
        id: userId,
        churchId,
      });
      
      const req = { user: { id: '2', churchId, role: UserRole.PASTOR } };
      
      await expect(controller.remove(userId, req)).rejects.toThrow(ForbiddenException);
    });

    it('should not allow a user to delete their own account', async () => {
      const userId = '3';
      const req = { user: { id: userId, churchId: '1', role: UserRole.MEMBER } };
      
      await expect(controller.remove(userId, req)).rejects.toThrow(ForbiddenException);
    });
  });
});
