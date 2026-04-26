import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramWebhookService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramWebhookService.name);

  constructor(
    @InjectBot() private bot: Telegraf,
    private config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const webhookUrl = this.config.get<string>('telegram.webhookUrl');
    if (!webhookUrl) return;

    const url = `https://${webhookUrl}/api/v1/telegram/webhook`;
    await this.bot.telegram.setWebhook(url);
    this.logger.log(`Telegram webhook set to ${url}`);
  }
}
