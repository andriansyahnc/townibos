import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { FaqCacheService } from '../faq-cache/faq-cache.service';
import { RegulationsService } from '../regulations/regulations.service';
import { TownsService } from '../towns/towns.service';
import { RagService } from './rag.service';

const mockRegulations = [
  { title: 'Parkir', category: 'parkir', content: 'Setiap unit mendapat 1 slot parkir.' },
  { title: 'Jam Tenang', category: 'tata_tertib', content: 'Jam tenang 22.00–06.00.' },
];

const mockAnthropicCreate = jest.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Setiap unit mendapat 1 slot parkir.' }],
});

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockAnthropicCreate },
  })),
}));

describe('RagService', () => {
  let service: RagService;
  let regulationsService: jest.Mocked<RegulationsService>;
  let faqCacheService: jest.Mocked<FaqCacheService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-api-key') },
        },
        {
          provide: RegulationsService,
          useValue: { getAllTexts: jest.fn().mockResolvedValue(mockRegulations) },
        },
        {
          provide: TownsService,
          useValue: { findOne: jest.fn().mockResolvedValue({ domainTemplateId: null }) },
        },
        {
          provide: FaqCacheService,
          useValue: {
            findSimilar: jest.fn().mockResolvedValue(null),
            save: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(RagService);
    regulationsService = module.get(RegulationsService);
    faqCacheService = module.get(FaqCacheService);
    service.onModuleInit();
    jest.clearAllMocks();
    regulationsService.getAllTexts = jest.fn().mockResolvedValue(mockRegulations);
    faqCacheService.findSimilar = jest.fn().mockResolvedValue(null);
    faqCacheService.save = jest.fn().mockResolvedValue(undefined);
  });

  describe('refreshContext', () => {
    it('builds context string from regulations for a given townId', async () => {
      await service.refreshContext('town-1');

      expect(regulationsService.getAllTexts).toHaveBeenCalledWith('town-1');
    });
  });

  describe('query', () => {
    it('calls Claude with the town regulations as system prompt', async () => {
      await service.refreshContext('town-1');
      mockAnthropicCreate.mockClear();

      await service.query('Berapa slot parkir?', 'town-1');

      expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
      const call = mockAnthropicCreate.mock.calls[0][0];
      expect(call.system[0].text).toContain('Parkir');
      expect(call.system[0].text).toContain('Jam Tenang');
      expect(call.messages[0].content).toBe('Berapa slot parkir?');
    });

    it('auto-refreshes context on first query for a town', async () => {
      await service.query('test question', 'town-new');

      expect(regulationsService.getAllTexts).toHaveBeenCalledWith('town-new');
    });

    it('returns fallback message when no regulations exist', async () => {
      regulationsService.getAllTexts = jest.fn().mockResolvedValue([]);
      await service.refreshContext('empty-town');

      const result = await service.query('anything', 'empty-town');

      expect(result).toContain('Belum ada peraturan');
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('uses cached context on subsequent queries for same town', async () => {
      await service.refreshContext('town-1');
      regulationsService.getAllTexts = jest.fn();

      await service.query('Q1', 'town-1');
      await service.query('Q2', 'town-1');

      expect(regulationsService.getAllTexts).not.toHaveBeenCalled();
    });

    it('returns cached answer without calling Claude when cache hit found', async () => {
      await service.refreshContext('town-1');
      faqCacheService.findSimilar = jest
        .fn()
        .mockResolvedValue({ answer: 'Jawaban dari cache' });

      const result = await service.query('Berapa slot parkir?', 'town-1');

      expect(result).toBe('Jawaban dari cache');
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('calls Claude and saves to cache when no cache hit', async () => {
      await service.refreshContext('town-1');
      mockAnthropicCreate.mockClear();
      faqCacheService.findSimilar = jest.fn().mockResolvedValue(null);

      await service.query('Berapa slot parkir?', 'town-1');

      expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
      // allow microtask for fire-and-forget
      await Promise.resolve();
      expect(faqCacheService.save).toHaveBeenCalledWith(
        'Berapa slot parkir?',
        expect.any(String),
        'town-1',
      );
    });

    it('does not throw if cache save fails', async () => {
      await service.refreshContext('town-1');
      mockAnthropicCreate.mockClear();
      faqCacheService.findSimilar = jest.fn().mockResolvedValue(null);
      faqCacheService.save = jest.fn().mockRejectedValue(new Error('Voyage down'));

      await expect(service.query('Berapa slot parkir?', 'town-1')).resolves.toBeDefined();
    });

    it('maintains separate context per town', async () => {
      regulationsService.getAllTexts = jest
        .fn()
        .mockResolvedValueOnce([{ title: 'A', category: 'lainnya', content: 'Town A rules' }])
        .mockResolvedValueOnce([{ title: 'B', category: 'lainnya', content: 'Town B rules' }]);

      await service.query('question', 'town-a');
      await service.query('question', 'town-b');

      const callA = mockAnthropicCreate.mock.calls[0][0];
      const callB = mockAnthropicCreate.mock.calls[1][0];
      expect(callA.system[0].text).toContain('Town A rules');
      expect(callB.system[0].text).toContain('Town B rules');
    });
  });

  describe('refreshAllContexts', () => {
    it('refreshes context for each provided townId', async () => {
      await service.refreshAllContexts(['t1', 't2', 't3']);

      expect(regulationsService.getAllTexts).toHaveBeenCalledTimes(3);
      expect(regulationsService.getAllTexts).toHaveBeenCalledWith('t1');
      expect(regulationsService.getAllTexts).toHaveBeenCalledWith('t2');
      expect(regulationsService.getAllTexts).toHaveBeenCalledWith('t3');
    });
  });
});
