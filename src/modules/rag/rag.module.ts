import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { RegulationsModule } from '../regulations/regulations.module';

@Module({
  imports: [RegulationsModule],
  providers: [RagService],
  controllers: [RagController],
  exports: [RagService],
})
export class RagModule {}
