import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Guardian, GuardianSchema } from './guardian.schema';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Guardian.name, schema: GuardianSchema }])],
  controllers: [GuardiansController],
  providers: [GuardiansService],
  exports: [GuardiansService],
})
export class GuardiansModule {}
