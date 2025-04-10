import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Church } from './church.entity';

export enum SermonStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

@Entity('sermons')
export class Sermon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ type: 'text' })
  content: string;

  @Column('simple-array', { nullable: true })
  bibleVerses: string[];

  @Column({ length: 100, nullable: true })
  theme: string;

  @Column({
    type: 'enum',
    enum: SermonStatus,
    default: SermonStatus.DRAFT
  })
  status: SermonStatus;

  @ManyToOne(() => User, user => user.sermons, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Church, church => church.sermons, { 
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'churchId' })
  church: Church;

  @Column()
  churchId: string;

  @Column({ default: false })
  isAiGenerated: boolean;

  @Column({ type: 'jsonb', nullable: true })
  aiPrompt: any;
  
  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ nullable: true })
  docxUrl: string;

  @Column({ nullable: true })
  audioUrl: string;
  
  @Column({ type: 'int', nullable: true })
  audioDuration: number;

  @Column({ nullable: true })
  lastScannedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
