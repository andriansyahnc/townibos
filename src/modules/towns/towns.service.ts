import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Town, TownDocument } from './town.schema';

@Injectable()
export class TownsService {
  constructor(@InjectModel(Town.name) private model: Model<TownDocument>) {}

  create(dto: Partial<Town>) {
    return this.model.create(dto);
  }

  findAll() {
    return this.model.find().exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(`Town ${id} not found`);
    return doc;
  }

  async findBySlug(slug: string) {
    const doc = await this.model.findOne({ slug }).exec();
    if (!doc) throw new NotFoundException(`Town ${slug} not found`);
    return doc;
  }

  async update(id: string, dto: Partial<Town>) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException(`Town ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException(`Town ${id} not found`);
    return { deleted: true };
  }

  findActive() {
    return this.model.find({ isActive: true }).exec();
  }
}
