import { Injectable, Logger } from '@nestjs/common';
import { Client, isFullPage } from '@notionhq/client';
import {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { RagService } from '../rag/rag.service';
import { RegulationsService } from '../regulations/regulations.service';
import { TownsService } from '../towns/towns.service';

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);

  constructor(
    private townsService: TownsService,
    private regulationsService: RegulationsService,
    private ragService: RagService,
  ) {}

  async syncAll(): Promise<{ townId: string; synced: number; errors: number }[]> {
    const towns = await this.townsService.findActive();
    return Promise.all(
      towns.map((town) =>
        this.syncTown(town._id.toString(), town.notionApiKey, town.notionDatabaseId),
      ),
    );
  }

  async syncOne(townId: string): Promise<{ townId: string; synced: number; errors: number }> {
    const town = await this.townsService.findOne(townId);
    return this.syncTown(town._id.toString(), town.notionApiKey, town.notionDatabaseId);
  }

  private async syncTown(
    townId: string,
    apiKey: string,
    databaseId: string,
  ): Promise<{ townId: string; synced: number; errors: number }> {
    const client = new Client({ auth: apiKey, notionVersion: '2022-06-28' });
    const pages = await this.fetchAllPages(client, databaseId);
    let synced = 0;
    let errors = 0;

    for (const page of pages) {
      try {
        const title = this.extractTitle(page);
        const category = this.extractCategory(page);
        const content = await this.fetchPageContent(client, page.id);

        if (!title || !content) continue;

        await this.regulationsService.upsertByNotionPageId(page.id, {
          townId: townId as any,
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

    await this.ragService.refreshContext(townId);
    this.logger.log(`Town ${townId} sync complete: ${synced} synced, ${errors} errors`);
    return { townId, synced, errors };
  }

  private async fetchAllPages(client: Client, databaseId: string): Promise<PageObjectResponse[]> {
    const pages: PageObjectResponse[] = [];
    let cursor: string | undefined;

    do {
      const response = await (client as any).request({
        path: `databases/${databaseId}/query`,
        method: 'post',
        body: { start_cursor: cursor, page_size: 100 },
      });

      for (const page of response.results) {
        if (isFullPage(page)) pages.push(page);
      }

      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return pages;
  }

  private async fetchPageContent(client: Client, pageId: string): Promise<string> {
    const lines: string[] = [];
    let cursor: string | undefined;

    do {
      const response = await client.blocks.children.list({
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
    if (type === 'paragraph') return this.richTextToPlain((block as any).paragraph.rich_text);
    if (type === 'heading_1')
      return `# ${this.richTextToPlain((block as any).heading_1.rich_text)}`;
    if (type === 'heading_2')
      return `## ${this.richTextToPlain((block as any).heading_2.rich_text)}`;
    if (type === 'heading_3')
      return `### ${this.richTextToPlain((block as any).heading_3.rich_text)}`;
    if (type === 'bulleted_list_item')
      return `- ${this.richTextToPlain((block as any).bulleted_list_item.rich_text)}`;
    if (type === 'numbered_list_item')
      return `1. ${this.richTextToPlain((block as any).numbered_list_item.rich_text)}`;
    if (type === 'to_do') {
      const checked = (block as any).to_do.checked ? '[x]' : '[ ]';
      return `${checked} ${this.richTextToPlain((block as any).to_do.rich_text)}`;
    }
    if (type === 'quote') return `> ${this.richTextToPlain((block as any).quote.rich_text)}`;
    if (type === 'callout') return this.richTextToPlain((block as any).callout.rich_text);
    if (type === 'toggle') return this.richTextToPlain((block as any).toggle.rich_text);
    if (type === 'divider') return '---';
    return '';
  }

  private richTextToPlain(richText: RichTextItemResponse[]): string {
    if (!richText?.length) return '';
    return richText.map((t) => t.plain_text).join('');
  }

  private extractTitle(page: PageObjectResponse): string {
    for (const key of Object.keys(page.properties)) {
      const prop = page.properties[key];
      if (prop.type === 'title' && prop.title?.length) {
        return prop.title.map((t) => t.plain_text).join('');
      }
    }
    return '';
  }

  private extractCategory(page: PageObjectResponse): string {
    const prop = page.properties['Category'] ?? page.properties['Kategori'];
    if (prop?.type === 'select' && prop.select?.name) {
      return prop.select.name.toLowerCase();
    }
    return '';
  }
}
