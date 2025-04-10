import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContentFlagCategory, ContentFlagSeverity } from '../services/content-moderation.service';
import { User } from './user.entity';
import { Church } from './church.entity';

@Entity('flagged_contents')
export class FlaggedContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contentType: string; // 'prayer_request', 'sermon', 'comment', etc.

  @Column()
  contentId: string;

  @Column({ type: 'text' })
  snippet: string;

  @Column({ default: true })
  isFlagged: boolean;

  @Column({
    type: 'enum',
    enum: ContentFlagSeverity,
    default: ContentFlagSeverity.NONE,
  })
  severity: ContentFlagSeverity;

  @Column('simple-array')
  categories: ContentFlagCategory[];

  @Column('simple-array')
  reasons: string[];

  @Column('float')
  moderationScore: number;

  @CreateDateColumn()
  flaggedAt: Date;

  @Column()
  churchId: string;

  @ManyToOne(() => Church)
  @JoinColumn({ name: 'churchId' })
  church: Church;

  @Column({ nullable: true })
  reviewedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy?: User;

  @Column({ nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  @Column({ default: false })
  resolved: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
