import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { FaqCache } from './faq-cache.schema';
import { FaqCacheService } from './faq-cache.service';

const mockEmbedding = (seed: number) => Array.from({ length: 8 }, (_, i) => (i + seed) * 0.1);

const mockVoyageEmbed = jest.fn();

jest.mock('voyageai', () => ({
  VoyageAIClient: jest.fn().mockImplementation(() => ({
    embed: mockVoyageEmbed,
  })),
}));

function makeModel(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const execMock = jest.fn().mockResolvedValue([]);
  const selectMock = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: execMock }), exec: execMock });
  const leanMock = jest.fn().mockReturnValue({ exec: execMock });
  return {
    find: jest.fn().mockReturnValue({ select: selectMock, lean: leanMock }),
    findById: jest.fn().mockReturnValue({ select: selectMock }),
    findOneAndUpdate: jest.fn().mockReturnValue({ select: selectMock }),
    findOneAndDelete: jest.fn().mockResolvedValue(null),
    updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    create: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('FaqCacheService', () => {
  let service: FaqCacheService;
  let model: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    model = makeModel();
    mockVoyageEmbed.mockResolvedValue({ data: [{ embedding: mockEmbedding(1) }] });

    const module = await Test.createTestingModule({
      providers: [
        FaqCacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'voyage.apiKey') return 'test-voyage-key';
              if (key === 'faqCache.similarityThreshold') return 0.92;
              return undefined;
            }),
          },
        },
        { provide: getModelToken(FaqCache.name), useValue: model },
      ],
    }).compile();

    service = module.get(FaqCacheService);
    service.onModuleInit();
    jest.clearAllMocks();
    mockVoyageEmbed.mockResolvedValue({ data: [{ embedding: mockEmbedding(1) }] });
  });

  describe('cosineSimilarity (via findSimilar)', () => {
    it('returns entry when similarity exceeds threshold', async () => {
      const identicalEmbedding = mockEmbedding(1);
      const entry = { _id: 'id1', question: 'Q', answer: 'A', embedding: identicalEmbedding, hitCount: 0 };

      const execMock = jest.fn().mockResolvedValue([entry]);
      model.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: execMock }) }),
      });
      model.updateOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const result = await service.findSimilar('any question', '507f1f77bcf86cd799439011');

      expect(result).not.toBeNull();
      expect(result?.answer).toBe('A');
    });

    it('returns null when no entry exceeds threshold', async () => {
      // query embedding is [0.1,0.2,...], stored embedding is very different
      mockVoyageEmbed.mockResolvedValue({ data: [{ embedding: mockEmbedding(1) }] });
      const differentEmbedding = mockEmbedding(100); // very different values
      const entry = { _id: 'id1', question: 'Q', answer: 'A', embedding: differentEmbedding, hitCount: 0 };

      const execMock = jest.fn().mockResolvedValue([entry]);
      model.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: execMock }) }),
      });

      const result = await service.findSimilar('any question', '507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });

    it('returns null when cache is empty', async () => {
      const execMock = jest.fn().mockResolvedValue([]);
      model.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: execMock }) }),
      });

      const result = await service.findSimilar('any question', '507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('findSimilar', () => {
    it('returns null without calling Voyage when VOYAGE_API_KEY is not set', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FaqCacheService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(undefined) },
          },
          { provide: getModelToken(FaqCache.name), useValue: model },
        ],
      }).compile();

      const noKeyService = module.get(FaqCacheService);
      noKeyService.onModuleInit();

      const result = await noKeyService.findSimilar('question', '507f1f77bcf86cd799439011');

      expect(result).toBeNull();
      expect(mockVoyageEmbed).not.toHaveBeenCalled();
    });

    it('returns null and logs error when Voyage API throws', async () => {
      mockVoyageEmbed.mockRejectedValue(new Error('Voyage down'));
      const execMock = jest.fn().mockResolvedValue([]);
      model.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: execMock }) }),
      });

      const result = await service.findSimilar('question', '507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });

    it('increments hitCount fire-and-forget on cache hit', async () => {
      const identicalEmbedding = mockEmbedding(1);
      const entry = { _id: 'id-hit', question: 'Q', answer: 'A', embedding: identicalEmbedding, hitCount: 3 };

      const execMock = jest.fn().mockResolvedValue([entry]);
      model.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: execMock }) }),
      });
      const updateExec = jest.fn().mockResolvedValue(null);
      model.updateOne = jest.fn().mockReturnValue({ exec: updateExec });

      await service.findSimilar('any question', '507f1f77bcf86cd799439011');
      await Promise.resolve(); // flush microtasks

      expect(model.updateOne).toHaveBeenCalledWith(
        { _id: 'id-hit' },
        expect.objectContaining({ $inc: { hitCount: 1 } }),
      );
    });
  });

  describe('save', () => {
    it('embeds question and creates document', async () => {
      await service.save('Berapa slot parkir?', 'Setiap unit 1 slot.', '507f1f77bcf86cd799439011');

      expect(mockVoyageEmbed).toHaveBeenCalledWith(
        expect.objectContaining({ input: ['Berapa slot parkir?'] }),
      );
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ question: 'Berapa slot parkir?', answer: 'Setiap unit 1 slot.' }),
      );
    });

    it('skips without calling Voyage when VOYAGE_API_KEY is not set', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FaqCacheService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(undefined) },
          },
          { provide: getModelToken(FaqCache.name), useValue: model },
        ],
      }).compile();

      const noKeyService = module.get(FaqCacheService);
      noKeyService.onModuleInit();
      await noKeyService.save('Q', 'A', '507f1f77bcf86cd799439011');

      expect(mockVoyageEmbed).not.toHaveBeenCalled();
      expect(model.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('returns { deleted: true }', async () => {
      model.findOneAndDelete = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
      const result = await service.remove('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439011');
      expect(result).toEqual({ deleted: true });
    });
  });
});
