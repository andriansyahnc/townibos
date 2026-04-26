import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Town } from './town.schema';
import { TownsService } from './towns.service';

const mockTowns = [
  { _id: 't1', name: 'Townibos A', slug: 'townibos-a', notionDatabaseId: 'db-1', isActive: true },
  { _id: 't2', name: 'Townibos B', slug: 'townibos-b', notionDatabaseId: 'db-2', isActive: false },
];

const execMock = jest.fn();
const mockModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ exec: execMock }),
  findById: jest.fn().mockReturnValue({ exec: execMock }),
  findOne: jest.fn().mockReturnValue({ exec: execMock }),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

describe('TownsService', () => {
  let service: TownsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TownsService, { provide: getModelToken(Town.name), useValue: mockModel }],
    }).compile();

    service = module.get(TownsService);
    jest.clearAllMocks();
    mockModel.find.mockReturnValue({ exec: execMock });
    mockModel.findById.mockReturnValue({ exec: execMock });
    mockModel.findOne.mockReturnValue({ exec: execMock });
  });

  it('creates a town', async () => {
    mockModel.create.mockResolvedValue(mockTowns[0]);

    const result = await service.create({
      name: 'Townibos A',
      slug: 'townibos-a',
      notionDatabaseId: 'db-1',
    });

    expect(mockModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockTowns[0]);
  });

  it('returns all towns', async () => {
    execMock.mockResolvedValue(mockTowns);

    const result = await service.findAll();

    expect(result).toEqual(mockTowns);
  });

  it('returns only active towns from findActive', async () => {
    const active = mockTowns.filter((t) => t.isActive);
    execMock.mockResolvedValue(active);

    const result = await service.findActive();

    expect(mockModel.find).toHaveBeenCalledWith({ isActive: true });
    expect(result).toHaveLength(1);
  });

  it('throws NotFoundException when town not found by id', async () => {
    execMock.mockResolvedValue(null);

    await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when town not found by slug', async () => {
    execMock.mockResolvedValue(null);

    await expect(service.findBySlug('no-such-slug')).rejects.toThrow(NotFoundException);
  });

  it('updates a town', async () => {
    mockModel.findByIdAndUpdate.mockResolvedValue({ ...mockTowns[0], name: 'Updated' });

    const result = await service.update('t1', { name: 'Updated' });

    expect(result.name).toBe('Updated');
  });

  it('throws NotFoundException on update when town not found', async () => {
    mockModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
  });

  it('deletes a town', async () => {
    mockModel.findByIdAndDelete.mockResolvedValue(mockTowns[0]);

    const result = await service.remove('t1');

    expect(result).toEqual({ deleted: true });
  });
});
