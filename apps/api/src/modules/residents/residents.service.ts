import * as crypto from 'crypto';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { EmailService } from '../../common/email/email.service';
import { ConfigService } from '@nestjs/config';
import { TownsService } from '../towns/towns.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { Resident, ResidentDocument } from './resident.schema';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident.name) private model: Model<ResidentDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private config: ConfigService,
    private townsService: TownsService,
  ) {}

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
    const resident = await this.model.findOneAndUpdate(filter, dto, { returnDocument: 'after' });
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
    return this.model.findOneAndUpdate(
      filter,
      { telegramChatId: chatId },
      { returnDocument: 'after' },
    );
  }

  async linkOrCreateTelegram(chatId: string, phone: string, townId: string, name: string) {
    const existing = await this.model.findOneAndUpdate(
      { phone, townId },
      { telegramChatId: chatId },
      { returnDocument: 'after' },
    );
    if (existing) return { resident: existing, created: false };

    const resident = await this.model.create({ name, phone, townId, telegramChatId: chatId });
    return { resident, created: true };
  }

  findByTelegramChatId(telegramChatId: string) {
    return this.model.findOne({ telegramChatId }).exec();
  }

  // --- Portal (resident self-service) ---

  async requestMagicLink(email: string): Promise<void> {
    const resident = await this.model.findOne({ email, isActive: true });
    if (!resident) return; // silent to prevent email enumeration

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.model.updateOne({ _id: resident._id }, { magicToken: token, magicTokenExpiry: expiry });

    const link = `${this.config.get('frontendUrl')}/portal/verify?token=${token}`;
    await this.emailService.sendMagicLink(resident.email, link, resident.name);
  }

  async verifyMagicLink(token: string): Promise<{ access_token: string }> {
    const resident = await this.model
      .findOne({ magicToken: token, magicTokenExpiry: { $gt: new Date() }, isActive: true })
      .select('+magicToken +magicTokenExpiry');
    if (!resident) throw new UnauthorizedException('Link tidak valid atau sudah kedaluwarsa');

    await this.model.updateOne(
      { _id: resident._id },
      { $unset: { magicToken: 1, magicTokenExpiry: 1 } },
    );

    const townId = resident.townId.toString();
    const town = await this.townsService.findOne(townId);
    const tpl = town?.domainTemplateId as any;
    const enabledModules = await this.townsService.getEnabledModules(townId);

    const payload = {
      sub: resident._id.toString(),
      role: 'resident',
      townId,
      memberLabel: tpl?.memberLabel ?? 'Penghuni',
      portalTitle: tpl?.portalTitle ?? 'Portal Penghuni',
      enabledModules,
    };
    return { access_token: this.jwtService.sign(payload, { expiresIn: '30d' }) };
  }

  async getMe(residentId: string) {
    const resident = await this.model.findById(residentId).populate('unitId').exec();
    if (!resident) throw new NotFoundException('Resident not found');
    return resident;
  }

  async updateMe(residentId: string, dto: { name?: string; email?: string; phone?: string }) {
    const resident = await this.model
      .findByIdAndUpdate(residentId, dto, { returnDocument: 'after' })
      .populate('unitId')
      .exec();
    if (!resident) throw new NotFoundException('Resident not found');
    return resident;
  }
}
