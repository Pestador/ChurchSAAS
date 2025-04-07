import { SermonStatus } from '../../../entities/sermon.entity';

export class SermonResponseDto {
  id: string;
  title: string;
  description?: string;
  content: string;
  bibleVerses?: string[];
  theme?: string;
  status: SermonStatus;
  authorId: string;
  churchId: string;
  isAiGenerated: boolean;
  aiPrompt?: Record<string, any>;
  pdfUrl?: string;
  docxUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateSermonDto {
  title: string;
  description?: string;
  content: string;
  bibleVerses?: string[];
  theme?: string;
  status?: SermonStatus;
}
