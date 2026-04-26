import { Command, Ctx, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { AnnouncementsService } from '../announcements/announcements.service';
import { PaymentsService } from '../payments/payments.service';
import { RagService } from '../rag/rag.service';
import { ResidentsService } from '../residents/residents.service';
import { TownsService } from '../towns/towns.service';

const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes

type PendingEntry = { slug: string; expiresAt: number };
const pendingDaftar = new Map<string, PendingEntry>(); // chatId → { slug, expiresAt }

function setPending(chatId: string, slug: string) {
  pendingDaftar.set(chatId, { slug, expiresAt: Date.now() + PENDING_TTL_MS });
}

function popPending(chatId: string): string | null {
  const entry = pendingDaftar.get(chatId);
  if (!entry) return null;
  pendingDaftar.delete(chatId);
  if (Date.now() > entry.expiresAt) return null;
  return entry.slug;
}

function peekPending(chatId: string): string | null {
  const entry = pendingDaftar.get(chatId);
  if (!entry || Date.now() > entry.expiresAt) {
    pendingDaftar.delete(chatId);
    return null;
  }
  return entry.slug;
}

@Update()
export class TelegramUpdate {
  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private ragService: RagService,
    private residentsService: ResidentsService,
    private announcementsService: AnnouncementsService,
    private paymentsService: PaymentsService,
    private townsService: TownsService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      `Halo! Selamat datang di bot Townibos 🏘️\n\n` +
        `Perintah yang tersedia:\n` +
        `/pengumuman — Lihat pengumuman terbaru\n` +
        `/tagihan — Cek tagihan iuran\n` +
        `/tanya [pertanyaan] — Tanya peraturan perumahan\n` +
        `/daftar <id-perumahan> — Daftarkan akun Telegram kamu`,
    );
  }

  @Command('pengumuman')
  async onPengumuman(@Ctx() ctx: Context): Promise<void> {
    const resident = await this.getResidentByChat(ctx);
    if (!resident) {
      await ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar <id-perumahan>');
      return;
    }

    try {
      const announcements = await this.announcementsService.getLatest(resident.townId.toString(), 3);
      if (!announcements.length) {
        await ctx.reply('Tidak ada pengumuman terbaru.');
        return;
      }
      const text = announcements.map((a) => `📢 *${a.title}*\n${a.body}`).join('\n\n---\n\n');
      await ctx.replyWithMarkdown(text);
    } catch {
      await ctx.reply('Gagal memuat pengumuman. Coba lagi nanti.');
    }
  }

  @Command('tagihan')
  async onTagihan(@Ctx() ctx: Context): Promise<void> {
    const resident = await this.getResidentByChat(ctx);
    if (!resident) {
      await ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar <id-perumahan>');
      return;
    }

    try {
      const payments = await this.paymentsService.getResidentPayments(String(resident._id));
      const pending = payments.filter((p) => p.status !== 'paid');

      if (!pending.length) {
        await ctx.reply('Semua tagihan sudah lunas ✅');
        return;
      }

      const text = pending
        .map(
          (p) => `💰 ${p.type} — ${p.period}: Rp ${p.amount.toLocaleString('id-ID')} (${p.status})`,
        )
        .join('\n');
      await ctx.reply(`Tagihan belum lunas:\n${text}`);
    } catch {
      await ctx.reply('Gagal memuat tagihan. Coba lagi nanti.');
    }
  }

  @Command('tanya')
  async onTanya(@Ctx() ctx: Context): Promise<void> {
    const resident = await this.getResidentByChat(ctx);
    if (!resident) {
      await ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar <id-perumahan>');
      return;
    }

    const text = (ctx.message as any)?.text || '';
    const question = text.replace('/tanya', '').trim();
    if (!question) {
      await ctx.reply('Contoh: /tanya Bolehkah memelihara kucing di unit?');
      return;
    }

    try {
      await ctx.reply('Mencari jawaban... ⏳');
      const answer = await this.ragService.query(question, resident.townId.toString());
      await ctx.reply(answer);
    } catch {
      await ctx.reply('Gagal mencari jawaban. Coba lagi nanti.');
    }
  }

  @Command('daftar')
  async onDaftar(@Ctx() ctx: Context): Promise<void> {
    const text = (ctx.message as any)?.text || '';
    const parts = text.replace('/daftar', '').trim().split(/\s+/);
    const slug = parts[0];

    if (!slug) {
      await ctx.reply('Format: /daftar <id-perumahan>\nContoh: /daftar griya-indah');
      return;
    }

    try {
      await this.townsService.findBySlug(slug);
    } catch {
      await ctx.reply('ID perumahan tidak ditemukan. Silahkan tanya admin.');
      return;
    }

    setPending(String(ctx.from.id), slug);

    await ctx.reply(
      'Tap tombol di bawah untuk bagikan nomor HP kamu.\nAtau ketik nomor HP kamu langsung (contoh: 08123456789).',
      {
        reply_markup: {
          keyboard: [[{ text: '📱 Bagikan Nomor HP', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      },
    );
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context): Promise<void> {
    const chatId = String(ctx.from.id);
    // popPending deletes atomically — prevents duplicate processing from race conditions
    const slug = popPending(chatId);

    await ctx.reply('Terima kasih!', { reply_markup: { remove_keyboard: true } });

    if (!slug) {
      await ctx.reply('Sesi pendaftaran sudah habis. Silahkan kirim /daftar <id-perumahan> lagi.');
      return;
    }

    const phone: string | null = (ctx.message as any)?.contact?.phone_number ?? null;
    if (!phone) {
      await ctx.reply(
        'Nomor HP tidak tersedia di akun Telegram kamu.\nSilahkan ketik nomor HP kamu langsung setelah /daftar <id-perumahan>.',
      );
      return;
    }

    try {
      const town = await this.townsService.findBySlug(slug);
      const telegramName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ');
      const { resident, created } = await this.residentsService.linkOrCreateTelegram(
        chatId,
        phone,
        String(town._id),
        telegramName,
      );
      const status = created ? 'Akun baru dibuat dan' : 'Akun';
      await ctx.reply(
        `Berhasil! ${status} ${resident.name} dari ${town.name} telah terhubung ke Telegram ✅`,
      );
    } catch {
      await ctx.reply('Pendaftaran gagal. Coba lagi dengan /daftar <id-perumahan>.');
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context): Promise<void> {
    const text = (ctx.message as any)?.text || '';
    if (text.startsWith('/')) return;

    const chatId = String(ctx.from.id);
    const pendingSlug = peekPending(chatId);

    if (pendingSlug) {
      const phone = text.trim();
      if (!/^(\+62|62|0)[0-9]{8,13}$/.test(phone)) {
        await ctx.reply('Format nomor HP tidak valid. Contoh: 08123456789 atau +6281234567890');
        return;
      }
      popPending(chatId);
      await ctx.reply('Memproses pendaftaran...', { reply_markup: { remove_keyboard: true } });
      try {
        const town = await this.townsService.findBySlug(pendingSlug);
        const telegramName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ');
        const { resident, created } = await this.residentsService.linkOrCreateTelegram(
          chatId,
          phone,
          String(town._id),
          telegramName,
        );
        const status = created ? 'Akun baru dibuat dan' : 'Akun';
        await ctx.reply(
          `Berhasil! ${status} ${resident.name} dari ${town.name} telah terhubung ke Telegram ✅`,
        );
      } catch {
        await ctx.reply('Pendaftaran gagal. Coba lagi dengan /daftar <id-perumahan>.');
      }
      return;
    }

    const resident = await this.getResidentByChat(ctx);
    if (!resident) {
      await ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar <id-perumahan>');
      return;
    }

    try {
      await ctx.reply('Mencari jawaban... ⏳');
      const answer = await this.ragService.query(text, resident.townId.toString());
      await ctx.reply(answer);
    } catch {
      await ctx.reply('Gagal mencari jawaban. Coba lagi nanti.');
    }
  }

  private getResidentByChat(ctx: Context) {
    const chatId = String(ctx.from?.id);
    return this.residentsService.findByTelegramChatId(chatId);
  }
}
