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
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
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

  it('finds all residents without townId filter for superadmin', async () => {
    execMock.mockResolvedValue([mockResident]);

    await service.findAll();

    expect(mockModel.find).toHaveBeenCalledWith({});
  });

  it('scopes findAll by townId for admin', async () => {
    execMock.mockResolvedValue([mockResident]);

    await service.findAll('town-1');

    expect(mockModel.find).toHaveBeenCalledWith({ townId: 'town-1' });
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

  describe('update', () => {
    it('updates and returns the resident', async () => {
      const updated = { ...mockResident, name: 'Budi Updated' };
      mockModel.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.update('r1', { name: 'Budi Updated' });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'r1' },
        { name: 'Budi Updated' },
        { new: true },
      );
      expect(result.name).toBe('Budi Updated');
    });

    it('scopes update to townId when provided', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue(mockResident);

      await service.update('r1', { name: 'Budi' }, 'town-1');

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'r1', townId: 'town-1' },
        { name: 'Budi' },
        { new: true },
      );
    });

    it('throws NotFoundException when resident not found', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a resident', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(mockResident);

      const result = await service.remove('r1');

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ _id: 'r1' });
      expect(result).toEqual({ deleted: true });
    });

    it('scopes remove to townId when provided', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(mockResident);

      await service.remove('r1', 'town-1');

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ _id: 'r1', townId: 'town-1' });
    });

    it('throws NotFoundException when resident not found', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
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
