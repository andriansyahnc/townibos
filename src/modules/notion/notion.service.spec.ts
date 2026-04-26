import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RagService } from '../rag/rag.service';
import { RegulationsService } from '../regulations/regulations.service';
import { TownsService } from '../towns/towns.service';
import { NotionService } from './notion.service';

const mockTown = {
  _id: { toString: () => 'town-1' },
  notionDatabaseId: 'db-abc123',
};

const mockNotionPages = [
  {
    id: 'page-1',
    properties: {
      Name: { type: 'title', title: [{ plain_text: 'Tata Tertib Parkir' }] },
      Category: { type: 'select', select: { name: 'parkir' } },
    },
  },
  {
    id: 'page-2',
    properties: {
      Name: { type: 'title', title: [{ plain_text: 'Jam Tenang' }] },
      Category: { type: 'select', select: { name: 'tata_tertib' } },
    },
  },
];

const mockDatabasesQuery = jest.fn().mockResolvedValue({
  results: mockNotionPages,
  has_more: false,
});

const mockBlocksList = jest.fn().mockResolvedValue({
  results: [{ type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Isi peraturan.' }] } }],
  has_more: false,
});

jest.mock('@notionhq/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    databases: { query: mockDatabasesQuery },
    blocks: { children: { list: mockBlocksList } },
  })),
  isFullPage: jest.fn().mockReturnValue(true),
}));

describe('NotionService', () => {
  let service: NotionService;
  let regulationsService: jest.Mocked<RegulationsService>;
  let ragService: jest.Mocked<RagService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotionService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
        {
          provide: TownsService,
          useValue: {
            findActive: jest.fn().mockResolvedValue([mockTown]),
            findOne: jest.fn().mockResolvedValue(mockTown),
          },
        },
        {
          provide: RegulationsService,
          useValue: { upsertByNotionPageId: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: RagService,
          useValue: { refreshContext: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(NotionService);
    regulationsService = module.get(RegulationsService);
    ragService = module.get(RagService);
    service.onModuleInit();
    jest.clearAllMocks();
    mockDatabasesQuery.mockResolvedValue({ results: mockNotionPages, has_more: false });
    mockBlocksList.mockResolvedValue({
      results: [
        { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Isi peraturan.' }] } },
      ],
      has_more: false,
    });
  });

  describe('syncAll', () => {
    it('syncs each active town and refreshes RAG context', async () => {
      const results = await service.syncAll();

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ townId: 'town-1', synced: 2, errors: 0 });
      expect(ragService.refreshContext).toHaveBeenCalledWith('town-1');
    });

    it('upserts regulations keyed on notionPageId', async () => {
      await service.syncAll();

      expect(regulationsService.upsertByNotionPageId).toHaveBeenCalledWith(
        'page-1',
        expect.objectContaining({ title: 'Tata Tertib Parkir', category: 'parkir' }),
      );
      expect(regulationsService.upsertByNotionPageId).toHaveBeenCalledWith(
        'page-2',
        expect.objectContaining({ title: 'Jam Tenang', category: 'tata_tertib' }),
      );
    });

    it('skips pages with empty content', async () => {
      mockBlocksList.mockResolvedValue({ results: [], has_more: false });

      const results = await service.syncAll();

      expect(results[0].synced).toBe(0);
      expect(regulationsService.upsertByNotionPageId).not.toHaveBeenCalled();
    });

    it('counts errors for failed pages without stopping the sync', async () => {
      regulationsService.upsertByNotionPageId = jest
        .fn()
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({});

      const results = await service.syncAll();

      expect(results[0].errors).toBe(1);
      expect(results[0].synced).toBe(1);
    });
  });

  describe('block parsing', () => {
    const cases: [string, object, string][] = [
      ['paragraph', { paragraph: { rich_text: [{ plain_text: 'Hello' }] } }, 'Hello'],
      ['heading_1', { heading_1: { rich_text: [{ plain_text: 'Title' }] } }, '# Title'],
      ['heading_2', { heading_2: { rich_text: [{ plain_text: 'Sub' }] } }, '## Sub'],
      ['heading_3', { heading_3: { rich_text: [{ plain_text: 'Minor' }] } }, '### Minor'],
      [
        'bulleted_list_item',
        { bulleted_list_item: { rich_text: [{ plain_text: 'Item' }] } },
        '- Item',
      ],
      [
        'numbered_list_item',
        { numbered_list_item: { rich_text: [{ plain_text: 'Step' }] } },
        '1. Step',
      ],
      ['quote', { quote: { rich_text: [{ plain_text: 'Note' }] } }, '> Note'],
      ['divider', {}, '---'],
      [
        'to_do checked',
        { to_do: { checked: true, rich_text: [{ plain_text: 'Done' }] } },
        '[x] Done',
      ],
      [
        'to_do unchecked',
        { to_do: { checked: false, rich_text: [{ plain_text: 'Todo' }] } },
        '[ ] Todo',
      ],
    ];

    it.each(cases)('converts %s block to correct markdown', async (type, extra, expected) => {
      const block = { type: type.split(' ')[0], ...extra };
      mockBlocksList.mockResolvedValueOnce({ results: [block], has_more: false });
      mockDatabasesQuery.mockResolvedValueOnce({
        results: [mockNotionPages[0]],
        has_more: false,
      });

      await service.syncAll();

      const upsertCall = regulationsService.upsertByNotionPageId.mock.calls[0][1];
      expect(upsertCall.content).toBe(expected);
    });
  });

  describe('category extraction', () => {
    it('defaults to lainnya for unknown category values', async () => {
      const page = {
        ...mockNotionPages[0],
        properties: {
          Name: mockNotionPages[0].properties.Name,
          Category: { type: 'select', select: { name: 'unknown_value' } },
        },
      };
      mockDatabasesQuery.mockResolvedValueOnce({ results: [page], has_more: false });

      await service.syncAll();

      expect(regulationsService.upsertByNotionPageId).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ category: 'lainnya' }),
      );
    });

    it('accepts Kategori as an alias for Category', async () => {
      const page = {
        ...mockNotionPages[0],
        properties: {
          Name: mockNotionPages[0].properties.Name,
          Kategori: { type: 'select', select: { name: 'fasilitas' } },
        },
      };
      mockDatabasesQuery.mockResolvedValueOnce({ results: [page], has_more: false });

      await service.syncAll();

      expect(regulationsService.upsertByNotionPageId).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ category: 'fasilitas' }),
      );
    });
  });
});
