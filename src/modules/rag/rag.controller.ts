import { Body, Controller, Post } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly service: RagService) {}

  @Post('query')
  query(@Body('question') question: string) {
    return this.service.query(question).then((answer) => ({ answer }));
  }

  @Post('refresh')
  refresh() {
    return this.service.refreshContext().then(() => ({ refreshed: true }));
  }
}
