import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BibleStudyService } from './bible-study.service';
import { BibleStudyController } from './bible-study.controller';
import { BibleStudy } from '../../entities/bible-study.entity';
import { Church } from '../../entities/church.entity';
import { OpenAIService } from '../../services/openai.service';

@Module({
  imports: [TypeOrmModule.forFeature([BibleStudy, Church])],
  controllers: [BibleStudyController],
  providers: [BibleStudyService, OpenAIService],
  exports: [BibleStudyService],
})
export class BibleStudyModule {}
