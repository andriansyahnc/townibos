import Anthropic from '@anthropic-ai/sdk';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegulationsService } from '../regulations/regulations.service';

@Injectable()
export class RagService implements OnModuleInit {
  private client: Anthropic;
  // Per-town context cache: townId → formatted regulations string
  private contextCache = new Map<string, string>();

  constructor(
    private config: ConfigService,
    private regulationsService: RegulationsService,
  ) {}

  onModuleInit() {
    this.client = new Anthropic({ apiKey: this.config.get<string>('anthropic.apiKey') });
  }

  async refreshContext(townId: string) {
    const regulations = await this.regulationsService.getAllTexts(townId);
    const context = regulations
      .map((r) => `## ${r.title} (${r.category})\n${r.content}`)
      .join('\n\n---\n\n');
    this.contextCache.set(townId, context);
  }

  async refreshAllContexts(townIds: string[]) {
    await Promise.all(townIds.map((id) => this.refreshContext(id)));
  }

  async query(question: string, townId: string): Promise<string> {
    if (!this.contextCache.has(townId)) {
      await this.refreshContext(townId);
    }

    const context = this.contextCache.get(townId) || '';

    if (!context) {
      return 'Belum ada peraturan yang terdaftar untuk perumahan ini.';
    }

    const systemPrompt = `Kamu adalah asisten penghuni perumahan yang ramah dan membantu.
Jawab pertanyaan berdasarkan peraturan perumahan di bawah ini saja.
Jika informasi tidak ada dalam peraturan, katakan dengan jujur bahwa kamu tidak tahu.
Gunakan Bahasa Indonesia yang sopan dan mudah dipahami.

# PERATURAN PERUMAHAN
${context}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: question }],
    });

    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }
}
