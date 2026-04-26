import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Resident, ResidentSchema } from './resident.schema';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Resident.name, schema: ResidentSchema }])],
  providers: [ResidentsService],
  controllers: [ResidentsController],
  exports: [ResidentsService],
})
export class ResidentsModule {}
