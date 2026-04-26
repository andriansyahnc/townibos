import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Guardian, GuardianDocument } from './guardian.schema';
import { CreateGuardianDto } from './dto/create-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(@InjectModel(Guardian.name) private model: Model<GuardianDocument>) {}

  create(dto: CreateGuardianDto & { townId: string }) {
    return this.model.create(dto);
  }

  findAll(townId?: string) {
    const filter: any = {};
    if (townId) filter.townId = townId;
    return this.model.find(filter).populate('studentId').sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('studentId').exec();
    if (!doc) throw new NotFoundException(`Guardian ${id} not found`);
    return doc;
  }

  async update(id: string, dto: Partial<CreateGuardianDto>, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const doc = await this.model.findOneAndUpdate(filter, dto, { new: true });
    if (!doc) throw new NotFoundException(`Guardian ${id} not found`);
    return doc;
  }

  async remove(id: string, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const doc = await this.model.findOneAndDelete(filter);
    if (!doc) throw new NotFoundException(`Guardian ${id} not found`);
    return { deleted: true };
  }

  getByStudent(studentId: string, townId?: string) {
    const filter: any = { studentId };
    if (townId) filter.townId = townId;
    return this.model.find(filter).sort({ relationship: 1 }).exec();
  }
}
