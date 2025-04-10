import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    // For platform admins: get all users across churches
    return this.usersRepository.find({ 
      relations: ['church'],
      order: { churchId: 'ASC', lastName: 'ASC', firstName: 'ASC' }
    });
  }
  
  async findAllByChurch(churchId: string): Promise<User[]> {
    // For tenant-specific access: only return users in the specified church
    return this.usersRepository.find({ 
      where: { churchId },
      relations: ['church'],
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id }, 
      relations: ['church'] 
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
  
  async findOneInChurch(id: string, churchId: string): Promise<User> {
    // For tenant-specific access: only return a user if they belong to the specified church
    const user = await this.usersRepository.findOne({ 
      where: { id, churchId },
      relations: ['church'] 
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found in church ${churchId}`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, ...userData } = createUserDto;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(password);

    try {
      const newUser = this.usersRepository.create({
        ...userData,
        email,
        password: hashedPassword,
      });
      return await this.usersRepository.save(newUser);
    } catch (error) {
      if (error.code === '23505') { 
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException('Error creating user');
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already registered by another user');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    try {
      return await this.usersRepository.save(user);
    } catch (error) { 
      if (error.code === '23505') { 
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException('Error updating user');
      }
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
