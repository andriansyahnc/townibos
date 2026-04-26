import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RagService } from './rag.service';

@ApiTags('rag')
@ApiBearerAuth()
@Controller('rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private readonly service: RagService) {}

  @Post('query')
  @ApiOperation({ summary: 'Ask a question about town regulations' })
  query(@Body('question') question: string, @CurrentUser() user: CurrentUserPayload) {
    if (!user.townId) throw new BadRequestException('RAG requires a town context');
    return this.service.query(question, user.townId).then((answer) => ({ answer }));
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh the RAG context cache for own town' })
  refresh(@CurrentUser() user: CurrentUserPayload) {
    if (!user.townId) throw new BadRequestException('RAG requires a town context');
    return this.service
      .refreshContext(user.townId)
      .then(() => ({ refreshed: true, townId: user.townId }));
  }
}
