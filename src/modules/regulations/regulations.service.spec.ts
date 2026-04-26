import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Regulation } from './regulation.schema';
import { RegulationsService } from './regulations.service';

const mockRegulation = {
  _id: 'reg-1',
  townId: 'town-1',
  title: 'Tata Tertib Parkir',
  category: 'parkir',
  content: 'Dilarang parkir sembarangan.',
  notionPageId: 'notion-page-1',
};

const execMock = jest.fn();
const mockModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ exec: execMock }),
  findById: jest.fn().mockReturnValue({ exec: execMock }),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

describe('RegulationsService', () => {
  let service: RegulationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RegulationsService,
        { provide: getModelToken(Regulation.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get(RegulationsService);
    jest.clearAllMocks();
    mockModel.find.mockReturnValue({ exec: execMock });
    mockModel.findById.mockReturnValue({ exec: execMock });
  });

  it('creates a regulation', async () => {
    mockModel.create.mockResolvedValue(mockRegulation);

    const result = await service.create({ title: 'Tata Tertib Parkir', townId: 'town-1' as any });

    expect(mockModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockRegulation);
  });

  describe('findAll', () => {
    it('returns all regulations without filter for superadmin', async () => {
      execMock.mockResolvedValue([mockRegulation]);

      await service.findAll();

      expect(mockModel.find).toHaveBeenCalledWith({});
    });

    it('scopes by townId when provided', async () => {
      execMock.mockResolvedValue([mockRegulation]);

      await service.findAll('town-1');

      expect(mockModel.find).toHaveBeenCalledWith({ townId: 'town-1' });
    });

    it('scopes by both townId and category when both provided', async () => {
      execMock.mockResolvedValue([mockRegulation]);

      await service.findAll('town-1', 'parkir');

      expect(mockModel.find).toHaveBeenCalledWith({ townId: 'town-1', category: 'parkir' });
    });

    it('filters by category only when townId is omitted', async () => {
      execMock.mockResolvedValue([mockRegulation]);

      await service.findAll(undefined, 'parkir');

      expect(mockModel.find).toHaveBeenCalledWith({ category: 'parkir' });
    });
  });

  describe('findOne', () => {
    it('returns a regulation by id', async () => {
      execMock.mockResolvedValue(mockRegulation);

      const result = await service.findOne('reg-1');

      expect(result).toEqual(mockRegulation);
    });

    it('throws NotFoundException when not found', async () => {
      execMock.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns the regulation', async () => {
      const updated = { ...mockRegulation, title: 'Updated' };
      mockModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update('reg-1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('throws NotFoundException when not found', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes and returns { deleted: true }', async () => {
      mockModel.findByIdAndDelete.mockResolvedValue(mockRegulation);

      const result = await service.remove('reg-1');

      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException when not found', async () => {
      mockModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  it('getAllTexts projects only title, content, and category fields', async () => {
    execMock.mockResolvedValue([mockRegulation]);

    await service.getAllTexts('town-1');

    expect(mockModel.find).toHaveBeenCalledWith(
      { townId: 'town-1' },
      { title: 1, content: 1, category: 1 },
    );
  });

  it('upsertByNotionPageId upserts with the notionPageId as key', async () => {
    mockModel.findOneAndUpdate.mockResolvedValue(mockRegulation);

    await service.upsertByNotionPageId('notion-page-1', { title: 'New' });

    expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
      { notionPageId: 'notion-page-1' },
      { $set: { title: 'New' } },
      { upsert: true, new: true },
    );
  });
});
