import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Unit, UnitSchema } from './unit.schema';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Unit.name, schema: UnitSchema }])],
  providers: [UnitsService],
  controllers: [UnitsController],
  exports: [UnitsService],
})
export class UnitsModule {}
