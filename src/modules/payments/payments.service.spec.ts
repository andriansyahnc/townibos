import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Payment } from './payment.schema';
import { PaymentsService } from './payments.service';

const mockPayment = {
  _id: 'pay-1',
  townId: 'town-1',
  residentId: 'res-1',
  unitId: 'unit-1',
  type: 'iuran',
  amount: 200000,
  period: '2026-04',
  status: 'pending',
};

const execMock = jest.fn();
const sortExecMock = { exec: execMock };
const populateMock = jest
  .fn()
  .mockReturnValue({ sort: jest.fn().mockReturnValue(sortExecMock), exec: execMock });
const mockModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ populate: populateMock }),
  findById: jest.fn().mockReturnValue({ populate: populateMock }),
  findByIdAndUpdate: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PaymentsService, { provide: getModelToken(Payment.name), useValue: mockModel }],
    }).compile();

    service = module.get(PaymentsService);
    jest.clearAllMocks();

    populateMock.mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: execMock }),
      exec: execMock,
    });
    mockModel.find.mockReturnValue({ populate: populateMock });
    mockModel.findById.mockReturnValue({ populate: populateMock });
  });

  it('creates a payment', async () => {
    mockModel.create.mockResolvedValue(mockPayment);

    const result = await service.create({ townId: 'town-1' as any, type: 'iuran' as any });

    expect(mockModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockPayment);
  });

  describe('findAll', () => {
    it('finds all payments with no filter', async () => {
      execMock.mockResolvedValue([mockPayment]);

      const result = await service.findAll();

      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(result).toHaveLength(1);
    });

    it('applies status and townId filters', async () => {
      execMock.mockResolvedValue([mockPayment]);

      await service.findAll({ status: 'pending', townId: 'town-1' });

      expect(mockModel.find).toHaveBeenCalledWith({ status: 'pending', townId: 'town-1' });
    });
  });

  describe('findOne', () => {
    it('returns a payment by id', async () => {
      execMock.mockResolvedValue(mockPayment);

      const result = await service.findOne('pay-1');

      expect(mockModel.findById).toHaveBeenCalledWith('pay-1');
      expect(result).toEqual(mockPayment);
    });

    it('throws NotFoundException when payment not found', async () => {
      execMock.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markPaid', () => {
    it('sets status to paid and records paidAt', async () => {
      const paid = { ...mockPayment, status: 'paid', paidAt: new Date() };
      mockModel.findByIdAndUpdate.mockResolvedValue(paid);

      const result = await service.markPaid('pay-1');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({ status: 'paid', paidAt: expect.any(Date) }),
        { new: true },
      );
      expect(result.status).toBe('paid');
    });

    it('throws NotFoundException when payment not found', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.markPaid('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  it('findOverdue returns payments with status overdue', async () => {
    const overdue = { ...mockPayment, status: 'overdue' };
    execMock.mockResolvedValue([overdue]);

    const result = await service.findOverdue();

    expect(mockModel.find).toHaveBeenCalledWith({ status: 'overdue' });
    expect(result).toHaveLength(1);
  });

  it('getResidentPayments returns payments for a resident sorted by period', async () => {
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });
    mockModel.find.mockReturnValue({ sort: sortMock });
    execMock.mockResolvedValue([mockPayment]);

    await service.getResidentPayments('res-1');

    expect(mockModel.find).toHaveBeenCalledWith({ residentId: 'res-1' });
    expect(sortMock).toHaveBeenCalledWith({ period: -1 });
  });
});
