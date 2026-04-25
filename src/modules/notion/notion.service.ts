import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, isFullPage, isFullBlock } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { RegulationsService } from '../regulations/regulations.service';
import { RagService } from '../rag/rag.service';

const VALID_CATEGORIES = ['tata_tertib', 'iuran', 'fasilitas', 'parkir', 'hewan', 'renovasi', 'lainnya'];

@Injectable()
export class NotionService implements OnModuleInit {
  private client: Client;
  private databaseId: string;
  private readonly logger = new Logger(NotionService.name);

  constructor(
    private config: ConfigService,
    private regulationsService: RegulationsService,
    private ragService: RagService,
  ) {}

  onModuleInit() {
    this.client = new Client({ auth: this.config.get<string>('notion.apiKey') });
    this.databaseId = this.config.get<string>('notion.databaseId');
  }

  async sync(): Promise<{ synced: number; errors: number }> {
    const pages = await this.fetchAllPages();
    let synced = 0;
    let errors = 0;

    for (const page of pages) {
      try {
        const title = this.extractTitle(page);
        const category = this.extractCategory(page);
        const content = await this.fetchPageContent(page.id);

        if (!title || !content) continue;

        await this.regulationsService.upsertByNotionPageId(page.id, {
          title,
          category,
          content,
          notionPageId: page.id,
        });

        synced++;
      } catch (err) {
        this.logger.error(`Failed to sync page ${page.id}: ${(err as Error).message}`);
        errors++;
      }
    }

    await this.ragService.refreshContext();
    this.logger.log(`Notion sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  private async fetchAllPages(): Promise<PageObjectResponse[]> {
    const pages: PageObjectResponse[] = [];
    let cursor: string | undefined;

    do {
      const response = await (this.client as any).databases.query({
        database_id: this.databaseId,
        start_cursor: cursor,
        page_size: 100,
      });

      for (const page of response.results) {
        if (isFullPage(page)) pages.push(page);
      }

      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return pages;
  }

  private async fetchPageContent(pageId: string): Promise<string> {
    const lines: string[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.client.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      });

      for (const block of response.results) {
        const text = this.blockToText(block as BlockObjectResponse);
        if (text) lines.push(text);
      }

      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return lines.join('\n');
  }

  private blockToText(block: BlockObjectResponse): string {
    const type = block.type;

    if (type === 'paragraph') {
      return this.richTextToPlain((block as any).paragraph.rich_text);
    }
    if (type === 'heading_1') {
      return `# ${this.richTextToPlain((block as any).heading_1.rich_text)}`;
    }
    if (type === 'heading_2') {
      return `## ${this.richTextToPlain((block as any).heading_2.rich_text)}`;
    }
    if (type === 'heading_3') {
      return `### ${this.richTextToPlain((block as any).heading_3.rich_text)}`;
    }
    if (type === 'bulleted_list_item') {
      return `- ${this.richTextToPlain((block as any).bulleted_list_item.rich_text)}`;
    }
    if (type === 'numbered_list_item') {
      return `1. ${this.richTextToPlain((block as any).numbered_list_item.rich_text)}`;
    }
    if (type === 'to_do') {
      const checked = (block as any).to_do.checked ? '[x]' : '[ ]';
      return `${checked} ${this.richTextToPlain((block as any).to_do.rich_text)}`;
    }
    if (type === 'quote') {
      return `> ${this.richTextToPlain((block as any).quote.rich_text)}`;
    }
    if (type === 'callout') {
      return this.richTextToPlain((block as any).callout.rich_text);
    }
    if (type === 'divider') {
      return '---';
    }
    if (type === 'toggle') {
      return this.richTextToPlain((block as any).toggle.rich_text);
    }

    return '';
  }

  private richTextToPlain(richText: RichTextItemResponse[]): string {
    if (!richText?.length) return '';
    return richText.map((t) => t.plain_text).join('');
  }

  private extractTitle(page: PageObjectResponse): string {
    const props = page.properties;
    for (const key of Object.keys(props)) {
      const prop = props[key];
      if (prop.type === 'title' && prop.title?.length) {
        return prop.title.map((t) => t.plain_text).join('');
      }
    }
    return '';
  }

  private extractCategory(page: PageObjectResponse): string {
    const categoryProp = page.properties['Category'] ?? page.properties['Kategori'];
    if (categoryProp?.type === 'select' && categoryProp.select?.name) {
      const value = categoryProp.select.name.toLowerCase();
      return VALID_CATEGORIES.includes(value) ? value : 'lainnya';
    }
    return 'lainnya';
  }
}
