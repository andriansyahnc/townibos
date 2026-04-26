import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { Town } from './town.schema';
import { TownsService } from './towns.service';

function makeDoc(data: Record<string, any>) {
  return {
    ...data,
    toObject() {
      return { ...data };
    },
  };
}

const mockTowns = [
  makeDoc({
    _id: 't1',
    name: 'Townibos A',
    slug: 'townibos-a',
    notionApiKey: 'enc:iv:tag:data',
    notionDatabaseId: 'db-1',
    isActive: true,
  }),
  makeDoc({
    _id: 't2',
    name: 'Townibos B',
    slug: 'townibos-b',
    notionApiKey: 'enc:iv:tag:data',
    notionDatabaseId: 'db-2',
    isActive: false,
  }),
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

const mockEncryption = {
  encrypt: jest.fn((v: string) => `encrypted:${v}`),
  decrypt: jest.fn((v: string) => v.replace('encrypted:', '')),
};

describe('TownsService', () => {
  let service: TownsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TownsService,
        { provide: getModelToken(Town.name), useValue: mockModel },
        { provide: EncryptionService, useValue: mockEncryption },
      ],
    }).compile();

    service = module.get(TownsService);
    jest.clearAllMocks();
    mockModel.find.mockReturnValue({ exec: execMock });
    mockModel.findById.mockReturnValue({ exec: execMock });
    mockModel.findOne.mockReturnValue({ exec: execMock });
    mockEncryption.encrypt.mockImplementation((v: string) => `encrypted:${v}`);
    mockEncryption.decrypt.mockImplementation((v: string) => v.replace('encrypted:', ''));
  });

  it('encrypts notionApiKey before saving on create', async () => {
    mockModel.create.mockResolvedValue(makeDoc(mockTowns[0]));

    await service.create({
      name: 'Townibos A',
      notionApiKey: 'secret_abc',
      notionDatabaseId: 'db-1',
    });

    expect(mockEncryption.encrypt).toHaveBeenCalledWith('secret_abc');
    expect(mockModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ notionApiKey: 'encrypted:secret_abc' }),
    );
  });

  it('decrypts notionApiKey on findOne', async () => {
    const encryptedDoc = makeDoc({ ...mockTowns[0], notionApiKey: 'encrypted:secret_key' });
    execMock.mockResolvedValue(encryptedDoc);

    const result = await service.findOne('t1');

    expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted:secret_key');
    expect(result.notionApiKey).toBe('secret_key');
  });

  it('decrypts notionApiKey on findAll', async () => {
    const docs = mockTowns.map((t) => makeDoc({ ...t, notionApiKey: 'encrypted:key' }));
    execMock.mockResolvedValue(docs);

    const results = await service.findAll();

    expect(results.every((r: any) => r.notionApiKey === 'key')).toBe(true);
  });

  it('returns only active towns from findActive', async () => {
    const active = [makeDoc({ ...mockTowns[0], notionApiKey: 'encrypted:k' })];
    execMock.mockResolvedValue(active);

    const result = await service.findActive();

    expect(mockModel.find).toHaveBeenCalledWith({ isActive: true });
    expect(result).toHaveLength(1);
  });

  it('encrypts notionApiKey on update', async () => {
    const updated = makeDoc({ ...mockTowns[0], notionApiKey: 'encrypted:new_key' });
    mockModel.findByIdAndUpdate.mockResolvedValue(updated);

    const result = await service.update('t1', { notionApiKey: 'new_key' });

    expect(mockEncryption.encrypt).toHaveBeenCalledWith('new_key');
    expect(result.notionApiKey).toBe('new_key');
  });

  it('throws NotFoundException when town not found by id', async () => {
    execMock.mockResolvedValue(null);

    await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when town not found by slug', async () => {
    execMock.mockResolvedValue(null);

    await expect(service.findBySlug('no-such-slug')).rejects.toThrow(NotFoundException);
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
