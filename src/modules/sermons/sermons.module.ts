import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SermonsService } from './sermons.service';
import { SermonsController } from './sermons.controller';
import { Sermon } from '../../entities/sermon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sermon])],
  controllers: [SermonsController],
  providers: [SermonsService],
  exports: [SermonsService],
})
export class SermonsModule {}
