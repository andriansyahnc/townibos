import { Module } from '@nestjs/common';
import { RegulationsModule } from '../regulations/regulations.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

@Module({
  imports: [RegulationsModule],
  providers: [RagService],
  controllers: [RagController],
  exports: [RagService],
})
export class RagModule {}
