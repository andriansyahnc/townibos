import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { Town, TownDocument } from './town.schema';

@Injectable()
export class TownsService {
  constructor(
    @InjectModel(Town.name) private model: Model<TownDocument>,
    private encryption: EncryptionService,
  ) {}

  async create(dto: Partial<Town>) {
    const data = { ...dto };
    if (data.notionApiKey) data.notionApiKey = this.encryption.encrypt(data.notionApiKey);
    return this.model.create(data);
  }

  async findAll() {
    const docs = await this.model.find().exec();
    return docs.map((d) => this.decryptTown(d));
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(`Town ${id} not found`);
    return this.decryptTown(doc);
  }

  async findBySlug(slug: string) {
    const doc = await this.model.findOne({ slug }).exec();
    if (!doc) throw new NotFoundException(`Town ${slug} not found`);
    return this.decryptTown(doc);
  }

  async update(id: string, dto: Partial<Town>) {
    const data = { ...dto };
    if (data.notionApiKey) data.notionApiKey = this.encryption.encrypt(data.notionApiKey);
    const doc = await this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    if (!doc) throw new NotFoundException(`Town ${id} not found`);
    return this.decryptTown(doc);
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException(`Town ${id} not found`);
    return { deleted: true };
  }

  async findActive() {
    const docs = await this.model.find({ isActive: true }).exec();
    return docs.map((d) => this.decryptTown(d));
  }

  private decryptTown(doc: TownDocument) {
    const obj = doc.toObject ? doc.toObject() : ({ ...doc } as any);
    if (obj.notionApiKey) {
      try {
        obj.notionApiKey = this.encryption.decrypt(obj.notionApiKey);
      } catch {
        // already plaintext (legacy row before encryption was added)
      }
    }
    return obj;
  }
}
