import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Unit, UnitDocument } from './unit.schema';

@Injectable()
export class UnitsService {
  constructor(@InjectModel(Unit.name) private model: Model<UnitDocument>) {}

  create(dto: Partial<Unit>) {
    return this.model.create(dto);
  }

  findAll(filter: Partial<Unit> = {}) {
    return this.model.find(filter).exec();
  }

  async findOne(id: string) {
    const unit = await this.model.findById(id).exec();
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    return unit;
  }

  async update(id: string, dto: Partial<Unit>, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const unit = await this.model.findOneAndUpdate(filter, dto, { returnDocument: 'after' });
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    return unit;
  }

  async remove(id: string, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const unit = await this.model.findOneAndDelete(filter);
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    return { deleted: true };
  }
}
