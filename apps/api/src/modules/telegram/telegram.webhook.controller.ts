import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Controller('telegram')
export class TelegramWebhookController {
  constructor(@InjectBot() private bot: Telegraf) {}

  @Post('webhook')
  @HttpCode(200)
  async handleUpdate(@Body() update: object) {
    await this.bot.handleUpdate(update as any);
  }
}
