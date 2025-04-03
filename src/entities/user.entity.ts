import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Church } from './church.entity';
import { Sermon } from './sermon.entity';
import { PrayerRequest } from './prayer-request.entity';

export enum UserRole {
  ADMIN = 'admin',      // Platform admin
  PASTOR = 'pastor',    // Church pastor (has admin rights for their church)
  MEMBER = 'member',    // Church member
  GUEST = 'guest'       // Unregistered or public user
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER
  })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl: string;

  @ManyToOne(() => Church, church => church.users, { 
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'churchId' })
  church: Church;

  @Column()
  churchId: string;

  @OneToMany(() => Sermon, sermon => sermon.author)
  sermons: Sermon[];

  @OneToMany(() => PrayerRequest, prayerRequest => prayerRequest.user)
  prayerRequests: PrayerRequest[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
