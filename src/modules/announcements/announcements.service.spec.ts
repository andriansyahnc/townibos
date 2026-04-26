import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Announcement } from './announcement.schema';
import { AnnouncementsService } from './announcements.service';

const mockAnnouncement = {
  _id: 'ann-1',
  townId: 'town-1',
  title: 'Kerja Bakti',
  body: 'Minggu pagi jam 7',
};

const execMock = jest.fn();
const sortMock = jest.fn().mockReturnValue({ exec: execMock });
const limitMock = jest.fn().mockReturnValue({ exec: execMock });
const sortThenLimitMock = jest.fn().mockReturnValue({ limit: limitMock });
const mockModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnValue({ sort: sortMock }),
  findById: jest.fn().mockReturnValue({ exec: execMock }),
  findByIdAndDelete: jest.fn(),
};

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: getModelToken(Announcement.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get(AnnouncementsService);
    jest.clearAllMocks();
    mockModel.find.mockReturnValue({ sort: sortMock });
    mockModel.findById.mockReturnValue({ exec: execMock });
    sortMock.mockReturnValue({ exec: execMock });
  });

  it('creates an announcement', async () => {
    mockModel.create.mockResolvedValue(mockAnnouncement);

    const result = await service.create({ title: 'Kerja Bakti', body: 'Minggu pagi jam 7' });

    expect(mockModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockAnnouncement);
  });

  describe('findAll', () => {
    it('finds all announcements without townId filter for superadmin', async () => {
      execMock.mockResolvedValue([mockAnnouncement]);

      await service.findAll();

      expect(mockModel.find).toHaveBeenCalledWith({});
    });

    it('scopes findAll by townId for admin', async () => {
      execMock.mockResolvedValue([mockAnnouncement]);

      await service.findAll('town-1');

      expect(mockModel.find).toHaveBeenCalledWith({ townId: 'town-1' });
    });
  });

  describe('findOne', () => {
    it('returns an announcement by id', async () => {
      execMock.mockResolvedValue(mockAnnouncement);

      const result = await service.findOne('ann-1');

      expect(mockModel.findById).toHaveBeenCalledWith('ann-1');
      expect(result).toEqual(mockAnnouncement);
    });

    it('throws NotFoundException when announcement not found', async () => {
      execMock.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes an announcement', async () => {
      mockModel.findByIdAndDelete.mockResolvedValue(mockAnnouncement);

      const result = await service.remove('ann-1');

      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException when announcement not found', async () => {
      mockModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  it('getLatest returns most recent announcements for a town', async () => {
    mockModel.find.mockReturnValue({ sort: sortThenLimitMock });
    limitMock.mockReturnValue({ exec: execMock });
    execMock.mockResolvedValue([mockAnnouncement]);

    const result = await service.getLatest('town-1', 3);

    expect(mockModel.find).toHaveBeenCalledWith({ townId: 'town-1' });
    expect(sortThenLimitMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(limitMock).toHaveBeenCalledWith(3);
    expect(result).toHaveLength(1);
  });
});
