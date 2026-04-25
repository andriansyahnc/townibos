import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './payment.schema';

@Injectable()
export class PaymentsService {
  constructor(@InjectModel(Payment.name) private model: Model<PaymentDocument>) {}

  create(dto: Partial<Payment>) {
    return this.model.create(dto);
  }

  findAll(filter: Record<string, any> = {}) {
    return this.model.find(filter).populate('residentId unitId').sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('residentId unitId').exec();
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }

  async markPaid(id: string) {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { status: 'paid', paidAt: new Date() },
      { new: true },
    );
    if (!doc) throw new NotFoundException(`Payment ${id} not found`);
    return doc;
  }

  findOverdue() {
    return this.model.find({ status: 'overdue' }).populate('residentId unitId').exec();
  }

  getResidentPayments(residentId: string) {
    return this.model.find({ residentId }).sort({ period: -1 }).exec();
  }
}
