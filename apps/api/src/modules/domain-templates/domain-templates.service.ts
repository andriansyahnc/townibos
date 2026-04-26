import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DomainTemplate, DomainTemplateDocument } from './domain-template.schema';
import { CreateDomainTemplateDto } from './dto/create-domain-template.dto';

@Injectable()
export class DomainTemplatesService {
  constructor(@InjectModel(DomainTemplate.name) private model: Model<DomainTemplateDocument>) {}

  findAll() {
    return this.model.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(`DomainTemplate ${id} not found`);
    return doc;
  }

  create(dto: CreateDomainTemplateDto) {
    return this.model.create(dto);
  }

  async update(id: string, dto: Partial<CreateDomainTemplateDto>) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException(`DomainTemplate ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException(`DomainTemplate ${id} not found`);
    return { deleted: true };
  }
}
