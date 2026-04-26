import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EncryptionModule } from '../../common/encryption/encryption.module';
import { DomainTemplatesModule } from '../domain-templates/domain-templates.module';
import { Town, TownSchema } from './town.schema';
import { TownsController } from './towns.controller';
import { TownsService } from './towns.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Town.name, schema: TownSchema }]),
    EncryptionModule,
    DomainTemplatesModule,
  ],
  providers: [TownsService],
  controllers: [TownsController],
  exports: [TownsService],
})
export class TownsModule {}
