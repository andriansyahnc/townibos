import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Score, ScoreDocument } from './score.schema';
import { CreateScoreDto } from './dto/create-score.dto';

@Injectable()
export class ScoresService {
  constructor(@InjectModel(Score.name) private model: Model<ScoreDocument>) {}

  create(dto: CreateScoreDto & { townId: string }) {
    return this.model.create(dto);
  }

  findAll(townId?: string, residentId?: string) {
    const filter: any = {};
    if (townId) filter.townId = townId;
    if (residentId) filter.residentId = residentId;
    return this.model.find(filter).populate('residentId').sort({ period: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('residentId').exec();
    if (!doc) throw new NotFoundException(`Score ${id} not found`);
    return doc;
  }

  async update(id: string, dto: Partial<CreateScoreDto>, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const doc = await this.model.findOneAndUpdate(filter, dto, { new: true });
    if (!doc) throw new NotFoundException(`Score ${id} not found`);
    return doc;
  }

  async remove(id: string, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const doc = await this.model.findOneAndDelete(filter);
    if (!doc) throw new NotFoundException(`Score ${id} not found`);
    return { deleted: true };
  }

  getByResident(residentId: string, townId?: string) {
    const filter: any = { residentId };
    if (townId) filter.townId = townId;
    return this.model.find(filter).sort({ period: -1, subject: 1 }).exec();
  }
}
