import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqCacheController } from './faq-cache.controller';
import { FaqCacheService } from './faq-cache.service';
import { FaqCache, FaqCacheSchema } from './faq-cache.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FaqCache.name, schema: FaqCacheSchema }])],
  providers: [FaqCacheService],
  controllers: [FaqCacheController],
  exports: [FaqCacheService],
})
export class FaqCacheModule {}
