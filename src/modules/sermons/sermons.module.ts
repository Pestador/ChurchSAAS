import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SermonsService } from './sermons.service';
import { SermonsController } from './sermons.controller';
import { Sermon } from '../../entities/sermon.entity';
import { Church } from '../../entities/church.entity';
import { OpenAIService } from '../../services/openai.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sermon, Church])],
  controllers: [SermonsController],
  providers: [SermonsService, OpenAIService],
  exports: [SermonsService],
})
export class SermonsModule {}
