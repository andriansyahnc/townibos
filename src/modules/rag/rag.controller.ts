import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RagService } from './rag.service';

@Controller('rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private readonly service: RagService) {}

  @Post('query')
  query(@Body('question') question: string, @CurrentUser() user: CurrentUserPayload) {
    const townId = user.townId;
    return this.service.query(question, townId).then((answer) => ({ answer }));
  }

  @Post('refresh')
  refresh(@CurrentUser() user: CurrentUserPayload) {
    const townId = user.townId;
    return this.service.refreshContext(townId).then(() => ({ refreshed: true, townId }));
  }
}
