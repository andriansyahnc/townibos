import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateResidentDto } from './dto/create-resident.dto';
import { Resident, ResidentDocument } from './resident.schema';

@Injectable()
export class ResidentsService {
  constructor(@InjectModel(Resident.name) private model: Model<ResidentDocument>) {}

  create(dto: CreateResidentDto) {
    return this.model.create(dto);
  }

  findAll() {
    return this.model.find().populate('unitId').exec();
  }

  async findOne(id: string) {
    const resident = await this.model.findById(id).populate('unitId').exec();
    if (!resident) throw new NotFoundException(`Resident ${id} not found`);
    return resident;
  }

  async update(id: string, dto: Partial<CreateResidentDto>) {
    const resident = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!resident) throw new NotFoundException(`Resident ${id} not found`);
    return resident;
  }

  async remove(id: string) {
    const resident = await this.model.findByIdAndDelete(id);
    if (!resident) throw new NotFoundException(`Resident ${id} not found`);
    return { deleted: true };
  }

  linkTelegram(chatId: string, phone: string) {
    return this.model.findOneAndUpdate({ phone }, { telegramChatId: chatId }, { new: true });
  }
}
