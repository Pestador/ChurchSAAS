import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SermonsService } from './sermons.service';
import { SermonsController } from './sermons.controller';
import { Sermon } from '../../entities/sermon.entity';
import { Church } from '../../entities/church.entity';
import { OpenAIService } from '../../services/openai.service';
import { ElevenLabsService } from '../../services/elevenlabs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sermon, Church])],
  controllers: [SermonsController],
  providers: [SermonsService, OpenAIService, ElevenLabsService],
  exports: [SermonsService],
})
export class SermonsModule {}
