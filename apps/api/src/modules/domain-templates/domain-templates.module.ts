import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DomainTemplate, DomainTemplateSchema } from './domain-template.schema';
import { DomainTemplatesController } from './domain-templates.controller';
import { DomainTemplatesService } from './domain-templates.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: DomainTemplate.name, schema: DomainTemplateSchema }])],
  controllers: [DomainTemplatesController],
  providers: [DomainTemplatesService],
  exports: [DomainTemplatesService],
})
export class DomainTemplatesModule {}
