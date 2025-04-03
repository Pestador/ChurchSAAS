import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BibleStudyService } from './bible-study.service';
import { BibleStudyController } from './bible-study.controller';
import { BibleStudy } from '../../entities/bible-study.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BibleStudy])],
  controllers: [BibleStudyController],
  providers: [BibleStudyService],
  exports: [BibleStudyService],
})
export class BibleStudyModule {}
