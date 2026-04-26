import { Module } from '@nestjs/common';
import { FaqCacheModule } from '../faq-cache/faq-cache.module';
import { RegulationsModule } from '../regulations/regulations.module';
import { TownsModule } from '../towns/towns.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

@Module({
  imports: [RegulationsModule, TownsModule, FaqCacheModule],
  providers: [RagService],
  controllers: [RagController],
  exports: [RagService],
})
export class RagModule {}
