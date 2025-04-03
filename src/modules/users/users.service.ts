import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(churchId: string): Promise<User[]> {
    return this.usersRepository.find({ 
      where: { churchId },
      relations: ['church'] 
    });
  }

  async findOne(id: string, churchId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id, churchId },
      relations: ['church'] 
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'churchId'],
    });
    return user;
  }

  async create(createUserDto: any, churchId: string): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      churchId,
    });

    return this.usersRepository.save(newUser);
  }

  async update(id: string, updateUserDto: any, churchId: string): Promise<User> {
    // Check if user exists
    await this.findOne(id, churchId);

    // Check if password is being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    await this.usersRepository.update({ id, churchId }, updateUserDto);
    return this.findOne(id, churchId);
  }

  async remove(id: string, churchId: string): Promise<void> {
    const user = await this.findOne(id, churchId);
    await this.usersRepository.remove(user);
  }
}
