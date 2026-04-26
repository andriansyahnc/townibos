import { Command, Ctx, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { AnnouncementsService } from '../announcements/announcements.service';
import { PaymentsService } from '../payments/payments.service';
import { RagService } from '../rag/rag.service';
import { ResidentsService } from '../residents/residents.service';

@Update()
export class TelegramUpdate {
  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private ragService: RagService,
    private residentsService: ResidentsService,
    private announcementsService: AnnouncementsService,
    private paymentsService: PaymentsService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      `Halo! Selamat datang di bot Townibos 🏘️\n\n` +
        `Perintah yang tersedia:\n` +
        `/pengumuman — Lihat pengumuman terbaru\n` +
        `/tagihan — Cek tagihan iuran\n` +
        `/tanya [pertanyaan] — Tanya peraturan perumahan\n` +
        `/daftar [nomor HP] — Daftarkan akun Telegram kamu`,
    );
  }

  @Command('pengumuman')
  async onPengumuman(@Ctx() ctx: Context) {
    const resident = await this.getResidentByChat(ctx);
    if (!resident)
      return ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar [nomor HP]');

    const announcements = await this.announcementsService.getLatest(resident.townId.toString(), 3);
    if (!announcements.length) return ctx.reply('Tidak ada pengumuman terbaru.');

    const text = announcements.map((a) => `📢 *${a.title}*\n${a.body}`).join('\n\n---\n\n');
    await ctx.replyWithMarkdown(text);
  }

  @Command('tagihan')
  async onTagihan(@Ctx() ctx: Context) {
    const resident = await this.getResidentByChat(ctx);
    if (!resident)
      return ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar [nomor HP]');

    const payments = await this.paymentsService.getResidentPayments(String(resident._id));
    const pending = payments.filter((p) => p.status !== 'paid');

    if (!pending.length) return ctx.reply('Semua tagihan sudah lunas ✅');

    const text = pending
      .map(
        (p) => `💰 ${p.type} — ${p.period}: Rp ${p.amount.toLocaleString('id-ID')} (${p.status})`,
      )
      .join('\n');
    await ctx.reply(`Tagihan belum lunas:\n${text}`);
  }

  @Command('tanya')
  async onTanya(@Ctx() ctx: Context) {
    const resident = await this.getResidentByChat(ctx);
    if (!resident)
      return ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar [nomor HP]');

    const text = (ctx.message as any)?.text || '';
    const question = text.replace('/tanya', '').trim();
    if (!question) return ctx.reply('Contoh: /tanya Bolehkah memelihara kucing di unit?');

    await ctx.reply('Mencari jawaban... ⏳');
    const answer = await this.ragService.query(question, resident.townId.toString());
    await ctx.reply(answer);
  }

  @Command('daftar')
  async onDaftar(@Ctx() ctx: Context) {
    const text = (ctx.message as any)?.text || '';
    const phone = text.replace('/daftar', '').trim();
    if (!phone) return ctx.reply('Format: /daftar 08xxxxxxxxxx');

    const chatId = String(ctx.from.id);
    const resident = await this.residentsService.linkTelegram(chatId, phone);
    if (!resident) return ctx.reply('Nomor HP tidak ditemukan. Hubungi pengelola perumahan.');

    await ctx.reply(`Berhasil! Akun ${resident.name} telah terhubung ke Telegram ✅`);
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const text = (ctx.message as any)?.text || '';
    if (text.startsWith('/')) return;

    const resident = await this.getResidentByChat(ctx);
    if (!resident)
      return ctx.reply('Akun Telegram kamu belum terdaftar. Gunakan /daftar [nomor HP]');

    await ctx.reply('Mencari jawaban... ⏳');
    const answer = await this.ragService.query(text, resident.townId.toString());
    await ctx.reply(answer);
  }

  private getResidentByChat(ctx: Context) {
    const chatId = String(ctx.from?.id);
    return this.residentsService.findByTelegramChatId(chatId);
  }
}
