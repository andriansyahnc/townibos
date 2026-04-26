import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RagService } from './rag.service';

class QueryRagDto {
  @ApiProperty({ example: 'Bolehkah memelihara kucing di unit?' })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({ example: '64b1f...', description: 'Town MongoDB ID' })
  @IsNotEmpty()
  @IsString()
  townId: string;
}

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(private readonly service: RagService) {}

  @Post('query')
  @ApiOperation({ summary: 'Ask a question about town regulations (public)' })
  query(@Body() dto: QueryRagDto) {
    return this.service.query(dto.question, dto.townId).then((answer) => ({ answer }));
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refresh the RAG context cache for own town (admin)' })
  refresh(@Body('townId') bodyTownId: string, @CurrentUser() user: CurrentUserPayload) {
    const townId = user.townId || bodyTownId;
    if (!townId) throw new BadRequestException('RAG requires a town context');
    return this.service
      .refreshContext(townId)
      .then(() => ({ refreshed: true, townId }));
  }
}
