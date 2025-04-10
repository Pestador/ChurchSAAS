import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Church } from './church.entity';

export enum PrayerRequestStatus {
  OPEN = 'open',
  ANSWERED = 'answered',
  CLOSED = 'closed'
}

export enum PrayerRequestVisibility {
  PUBLIC = 'public',     // Visible to all church members
  PRIVATE = 'private',   // Visible only to the author and pastors
  PASTORAL = 'pastoral'  // Visible only to pastors
}

@Entity('prayer_requests')
export class PrayerRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: PrayerRequestStatus,
    default: PrayerRequestStatus.OPEN
  })
  status: PrayerRequestStatus;

  @Column({
    type: 'enum',
    enum: PrayerRequestVisibility,
    default: PrayerRequestVisibility.PRIVATE
  })
  visibility: PrayerRequestVisibility;

  @ManyToOne(() => User, user => user.prayerRequests, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Church, church => church.prayerRequests, { 
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'churchId' })
  church: Church;

  @Column()
  churchId: string;

  @Column('simple-array', { nullable: true })
  relatedBibleVerses: string[];

  @Column({ type: 'text', nullable: true })
  aiResponse: string;

  @Column({ default: 0 })
  prayerCount: number;

  @Column({ nullable: true })
  lastScannedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
