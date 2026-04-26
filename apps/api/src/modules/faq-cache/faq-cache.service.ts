import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VoyageAIClient } from 'voyageai';
import { FaqCache, FaqCacheDocument } from './faq-cache.schema';

@Injectable()
export class FaqCacheService implements OnModuleInit {
  private readonly logger = new Logger(FaqCacheService.name);
  private voyageClient: VoyageAIClient;

  constructor(
    @InjectModel(FaqCache.name) private readonly model: Model<FaqCacheDocument>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('voyage.apiKey');
    if (apiKey) {
      this.voyageClient = new VoyageAIClient({ apiKey });
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.voyageClient.embed({
      model: 'voyage-3-lite',
      input: [text],
      inputType: 'query',
    });
    return result.data[0].embedding;
  }

  async findSimilar(question: string, townId: string): Promise<FaqCacheDocument | null> {
    if (!this.config.get('voyage.apiKey')) return null;

    const threshold = this.config.get<number>('faqCache.similarityThreshold') ?? 0.92;

    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.embed(question);
    } catch (err) {
      this.logger.error(`Voyage embed gagal: ${err}`);
      return null;
    }

    const entries = await this.model
      .find({ townId: new Types.ObjectId(townId) })
      .select('question answer embedding hitCount')
      .lean()
      .exec();

    let best: (typeof entries)[0] | null = null;
    let bestScore = -1;

    for (const entry of entries) {
      const score = this.cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    if (!best || bestScore < threshold) return null;

    // fire-and-forget: update hit stats
    this.model
      .updateOne({ _id: best._id }, { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } })
      .exec()
      .catch(() => {});

    return best as unknown as FaqCacheDocument;
  }

  async save(question: string, answer: string, townId: string): Promise<void> {
    if (!this.config.get('voyage.apiKey')) return;

    const embedding = await this.embed(question);
    await this.model.create({ townId: new Types.ObjectId(townId), question, answer, embedding });
  }

  findAll(townId?: string) {
    const filter = townId ? { townId: new Types.ObjectId(townId) } : {};
    return this.model.find(filter).select('-embedding').sort({ hitCount: -1 }).exec();
  }

  findOne(id: string) {
    return this.model.findById(id).select('-embedding').exec();
  }

  async update(id: string, dto: { answer?: string }, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = new Types.ObjectId(townId);
    return this.model.findOneAndUpdate(filter, dto, { new: true }).select('-embedding').exec();
  }

  async remove(id: string, townId?: string) {
    const filter: any = { _id: id };
    if (townId) filter.townId = new Types.ObjectId(townId);
    await this.model.findOneAndDelete(filter).exec();
    return { deleted: true };
  }
}
