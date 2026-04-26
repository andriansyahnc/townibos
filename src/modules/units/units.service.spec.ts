import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Unit } from './unit.schema';
import { UnitsService } from './units.service';

const mockUnit = {
  _id: 'unit-1',
  townId: 'town-1',
  block: 'A',
  number: '01',
  floor: 1,
  type: 'standard',
  status: 'occupied',
};

const execMock = jest.fn();
const mockModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ exec: execMock }),
  findById: jest.fn().mockReturnValue({ exec: execMock }),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
};

describe('UnitsService', () => {
  let service: UnitsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UnitsService, { provide: getModelToken(Unit.name), useValue: mockModel }],
    }).compile();

    service = module.get(UnitsService);
    jest.clearAllMocks();
    mockModel.find.mockReturnValue({ exec: execMock });
    mockModel.findById.mockReturnValue({ exec: execMock });
  });

  it('creates a unit', async () => {
    mockModel.create.mockResolvedValue(mockUnit);

    const result = await service.create({ block: 'A', number: '01' });

    expect(mockModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockUnit);
  });

  describe('findAll', () => {
    it('returns all units with no filter', async () => {
      execMock.mockResolvedValue([mockUnit]);

      await service.findAll();

      expect(mockModel.find).toHaveBeenCalledWith({});
    });

    it('applies townId and status filters', async () => {
      execMock.mockResolvedValue([mockUnit]);

      await service.findAll({ townId: 'town-1' as any, status: 'occupied' as any });

      expect(mockModel.find).toHaveBeenCalledWith({ townId: 'town-1', status: 'occupied' });
    });
  });

  describe('findOne', () => {
    it('returns a unit by id', async () => {
      execMock.mockResolvedValue(mockUnit);

      const result = await service.findOne('unit-1');

      expect(result).toEqual(mockUnit);
    });

    it('throws NotFoundException when unit not found', async () => {
      execMock.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns the unit', async () => {
      const updated = { ...mockUnit, status: 'vacant' };
      mockModel.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.update('unit-1', { status: 'vacant' as any });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'unit-1' },
        { status: 'vacant' },
        { returnDocument: 'after' },
      );
      expect(result.status).toBe('vacant');
    });

    it('scopes update to townId when provided', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue(mockUnit);

      await service.update('unit-1', {}, 'town-1');

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'unit-1', townId: 'town-1' },
        {},
        { returnDocument: 'after' },
      );
    });

    it('throws NotFoundException when unit not found', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes and returns { deleted: true }', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(mockUnit);

      const result = await service.remove('unit-1');

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ _id: 'unit-1' });
      expect(result).toEqual({ deleted: true });
    });

    it('scopes remove to townId when provided', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(mockUnit);

      await service.remove('unit-1', 'town-1');

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ _id: 'unit-1', townId: 'town-1' });
    });

    it('throws NotFoundException when unit not found', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
