import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Resident, ResidentSchema } from './resident.schema';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Resident.name, schema: ResidentSchema }])],
  providers: [ResidentsService],
  controllers: [ResidentsController],
  exports: [ResidentsService],
})
export class ResidentsModule {}
