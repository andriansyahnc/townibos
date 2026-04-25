import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Regulation, RegulationSchema } from './regulation.schema';
import { RegulationsService } from './regulations.service';
import { RegulationsController } from './regulations.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Regulation.name, schema: RegulationSchema }])],
  providers: [RegulationsService],
  controllers: [RegulationsController],
  exports: [RegulationsService],
})
export class RegulationsModule {}
