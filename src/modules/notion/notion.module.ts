import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { RegulationsModule } from '../regulations/regulations.module';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';

@Module({
  imports: [RegulationsModule, RagModule],
  providers: [NotionService],
  controllers: [NotionController],
})
export class NotionModule {}
