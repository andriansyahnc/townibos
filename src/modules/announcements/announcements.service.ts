import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Announcement, AnnouncementDocument } from './announcement.schema';

@Injectable()
export class AnnouncementsService {
  constructor(@InjectModel(Announcement.name) private model: Model<AnnouncementDocument>) {}

  create(dto: Partial<Announcement>) {
    return this.model.create(dto);
  }

  findAll(townId?: string) {
    const filter: any = {};
    if (townId) filter.townId = townId;
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(`Announcement ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException(`Announcement ${id} not found`);
    return { deleted: true };
  }

  getLatest(townId: string, limit = 5) {
    return this.model.find({ townId }).sort({ createdAt: -1 }).limit(limit).exec();
  }
}
