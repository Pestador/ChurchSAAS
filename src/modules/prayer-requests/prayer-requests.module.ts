import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrayerRequestsService } from './prayer-requests.service';
import { PrayerRequestsController } from './prayer-requests.controller';
import { PrayerRequest } from '../../entities/prayer-request.entity';
import { Church } from '../../entities/church.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrayerRequest, Church])],
  controllers: [PrayerRequestsController],
  providers: [PrayerRequestsService],
  exports: [PrayerRequestsService],
})
export class PrayerRequestsModule {}
