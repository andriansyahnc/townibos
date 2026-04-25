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

  findAll(category?: string) {
    return this.model.find(category ? { category } : {}).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(`Regulation ${id} not found`);
    return doc;
  }

  async update(id: string, dto: Partial<Regulation>) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new NotFoundException(`Regulation ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException(`Regulation ${id} not found`);
    return { deleted: true };
  }

  // Fetch all regulations without embeddings for RAG context building
  getAllTexts() {
    return this.model.find({}, { title: 1, content: 1, category: 1 }).exec();
  }

  // Upsert a regulation synced from Notion — keyed on notionPageId
  upsertByNotionPageId(notionPageId: string, dto: Partial<Regulation>) {
    return this.model.findOneAndUpdate(
      { notionPageId },
      { $set: dto },
      { upsert: true, new: true },
    );
  }

  // Store embedding for a regulation chunk (for vector similarity later)
  async saveEmbedding(id: string, embedding: number[]) {
    return this.model.findByIdAndUpdate(id, { embedding }, { new: true });
  }
}
