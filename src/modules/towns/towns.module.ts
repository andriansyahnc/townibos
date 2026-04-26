import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Town, TownSchema } from './town.schema';
import { TownsController } from './towns.controller';
import { TownsService } from './towns.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Town.name, schema: TownSchema }])],
  providers: [TownsService],
  controllers: [TownsController],
  exports: [TownsService],
})
export class TownsModule {}
