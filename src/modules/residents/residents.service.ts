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

  findAll(townId?: string) {
    const filter: any = {};
    if (townId) filter.townId = townId;
    return this.model.find(filter).populate('unitId').exec();
  }

  async findOne(id: string) {
    const resident = await this.model.findById(id).populate('unitId').exec();
    if (!resident) throw new NotFoundException(`Resident ${id} not found`);
    return resident;
  }

  async update(id: string, dto: Partial<CreateResidentDto>, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const resident = await this.model.findOneAndUpdate(filter, dto, { new: true });
    if (!resident) throw new NotFoundException(`Resident ${id} not found`);
    return resident;
  }

  async remove(id: string, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = townId;
    const resident = await this.model.findOneAndDelete(filter);
    if (!resident) throw new NotFoundException(`Resident ${id} not found`);
    return { deleted: true };
  }

  linkTelegram(chatId: string, phone: string, townId?: string) {
    const filter: any = { phone };
    if (townId) filter.townId = townId;
    return this.model.findOneAndUpdate(filter, { telegramChatId: chatId }, { new: true });
  }

  findByTelegramChatId(telegramChatId: string) {
    return this.model.findOne({ telegramChatId }).exec();
  }
}
