import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { RegulationsService } from '../regulations/regulations.service';

@Injectable()
export class RagService implements OnModuleInit {
  private client: Anthropic;
  private cachedRegulationsPrompt: string = '';

  constructor(
    private config: ConfigService,
    private regulationsService: RegulationsService,
  ) {}

  onModuleInit() {
    this.client = new Anthropic({ apiKey: this.config.get<string>('anthropic.apiKey') });
  }

  // Rebuild the context cache from DB — call after any regulation update
  async refreshContext() {
    const regulations = await this.regulationsService.getAllTexts();
    this.cachedRegulationsPrompt = regulations
      .map((r) => `## ${r.title} (${r.category})\n${r.content}`)
      .join('\n\n---\n\n');
  }

  async query(question: string): Promise<string> {
    if (!this.cachedRegulationsPrompt) {
      await this.refreshContext();
    }

    const systemPrompt = `Kamu adalah asisten penghuni perumahan yang ramah dan membantu.
Jawab pertanyaan berdasarkan peraturan perumahan di bawah ini saja.
Jika informasi tidak ada dalam peraturan, katakan dengan jujur bahwa kamu tidak tahu.
Gunakan Bahasa Indonesia yang sopan dan mudah dipahami.

# PERATURAN PERUMAHAN
${this.cachedRegulationsPrompt}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          // Prompt caching: the regulations context rarely changes
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: question }],
    });

    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }
}
