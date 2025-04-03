import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Church } from './church.entity';

export enum BibleStudyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

@Entity('bible_studies')
export class BibleStudy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ type: 'text' })
  content: string;

  @Column('simple-array')
  bibleVerses: string[];

  @Column({
    type: 'enum',
    enum: BibleStudyStatus,
    default: BibleStudyStatus.DRAFT
  })
  status: BibleStudyStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Church, church => church.bibleStudies, { 
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'churchId' })
  church: Church;

  @Column()
  churchId: string;

  @Column({ default: false })
  isAiGenerated: boolean;

  @Column({ type: 'json', nullable: true })
  aiGeneratedExplanations: Record<string, any>;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
