import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Regulation, RegulationDocument } from './regulation.schema';

@Injectable()
export class RegulationsService {
  constructor(@InjectModel(Regulation.name) private model: Model<RegulationDocument>) {}

  create(dto: Partial<Regulation>) {
    return this.model.create(dto);
  }

  findAll(townId?: string, category?: string, status?: string) {
    const filter: any = {};
    if (townId) filter.townId = townId;
    if (category) filter.category = category;
    if (status) filter.status = status;
    return this.model.find(filter).sort({ effectiveDate: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(`Regulation ${id} not found`);
    return doc;
  }

  async update(id: string, dto: Partial<Regulation>, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const doc = await this.model.findOneAndUpdate(filter, dto, { returnDocument: 'after' });
    if (!doc) throw new NotFoundException(`Regulation ${id} not found`);
    return doc;
  }

  async remove(id: string, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const doc = await this.model.findOneAndDelete(filter);
    if (!doc) throw new NotFoundException(`Regulation ${id} not found`);
    return { deleted: true };
  }

  getAllTexts(townId: string) {
    return this.model
      .find(
        { townId, status: 'aktif' },
        { title: 1, content: 1, category: 1, effectiveDate: 1, source: 1 },
      )
      .sort({ effectiveDate: -1 })
      .exec();
  }

  upsertByNotionPageId(notionPageId: string, dto: Partial<Regulation>) {
    return this.model.findOneAndUpdate(
      { notionPageId },
      { $set: dto },
      { upsert: true, returnDocument: 'after' },
    );
  }

  async saveEmbedding(id: string, embedding: number[]) {
    return this.model.findOneAndUpdate({ _id: id }, { embedding }, { returnDocument: 'after' });
  }
}
