import { Controller, Post } from '@nestjs/common';
import { NotionService } from './notion.service';

@Controller('notion')
export class NotionController {
  constructor(private readonly service: NotionService) {}

  @Post('sync')
  sync() {
    return this.service.sync();
  }
}
