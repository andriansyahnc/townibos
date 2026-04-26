import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Resident } from './resident.schema';
import { ResidentsService } from './residents.service';

const mockResident = {
  _id: 'r1',
  name: 'Budi',
  email: 'budi@example.com',
  phone: '081234567890',
  townId: 'town-1',
  telegramChatId: null,
};

const execMock = jest.fn();
const mockModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: execMock }) }),
  findById: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: execMock }) }),
  findOne: jest.fn().mockReturnValue({ exec: execMock }),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

describe('ResidentsService', () => {
  let service: ResidentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ResidentsService, { provide: getModelToken(Resident.name), useValue: mockModel }],
    }).compile();

    service = module.get(ResidentsService);
    jest.clearAllMocks();
    mockModel.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: execMock }) });
    mockModel.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: execMock }) });
    mockModel.findOne.mockReturnValue({ exec: execMock });
  });

  it('creates a resident', async () => {
    mockModel.create.mockResolvedValue(mockResident);

    const result = await service.create({
      name: 'Budi',
      email: 'budi@example.com',
      phone: '081234567890',
    });

    expect(result).toEqual(mockResident);
  });

  it('throws NotFoundException when resident not found by id', async () => {
    execMock.mockResolvedValue(null);

    await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
  });

  describe('linkTelegram', () => {
    it('links telegram chat id by phone number', async () => {
      const linked = { ...mockResident, telegramChatId: '12345' };
      mockModel.findOneAndUpdate.mockResolvedValue(linked);

      const result = await service.linkTelegram('12345', '081234567890');

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { phone: '081234567890' },
        { telegramChatId: '12345' },
        { new: true },
      );
      expect(result.telegramChatId).toBe('12345');
    });

    it('returns null when phone not found', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue(null);

      const result = await service.linkTelegram('12345', '0800000000');

      expect(result).toBeNull();
    });
  });

  describe('findByTelegramChatId', () => {
    it('finds resident by telegram chat id', async () => {
      execMock.mockResolvedValue({ ...mockResident, telegramChatId: '99999' });

      const result = await service.findByTelegramChatId('99999');

      expect(mockModel.findOne).toHaveBeenCalledWith({ telegramChatId: '99999' });
      expect(result.telegramChatId).toBe('99999');
    });

    it('returns null when no resident has that chat id', async () => {
      execMock.mockResolvedValue(null);

      const result = await service.findByTelegramChatId('unknown');

      expect(result).toBeNull();
    });
  });
});
