import { Module } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { RegulationsModule } from '../regulations/regulations.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RegulationsModule, RagModule],
  providers: [NotionService],
  controllers: [NotionController],
})
export class NotionModule {}
