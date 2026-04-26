import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from '../config/configuration';
import { AuthModule } from '../modules/auth/auth.module';
import { AuthService } from '../modules/auth/auth.service';
import { DomainTemplatesModule } from '../modules/domain-templates/domain-templates.module';
import { DomainTemplatesService } from '../modules/domain-templates/domain-templates.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/townibos'),
    AuthModule,
    DomainTemplatesModule,
  ],
})
class SeedModule {}

const DOMAIN_TEMPLATES = [
  {
    name: 'Perumahan',
    slug: 'perumahan',
    memberLabel: 'Penghuni',
    assetLabel: 'Unit',
    documentLabel: 'Peraturan',
    ragRole: 'asisten informasi perumahan',
    portalTitle: 'Portal Penghuni',
    enabledModules: ['residents', 'units', 'announcements', 'payments', 'regulations'],
  },
  {
    name: 'Sekolah',
    slug: 'sekolah',
    memberLabel: 'Siswa',
    assetLabel: 'Kelas',
    documentLabel: 'Peraturan Sekolah',
    ragRole: 'asisten informasi sekolah',
    portalTitle: 'Portal Siswa',
    enabledModules: ['residents', 'announcements', 'regulations', 'scores', 'guardians'],
  },
  {
    name: 'Kantor',
    slug: 'kantor',
    memberLabel: 'Karyawan',
    assetLabel: 'Ruangan',
    documentLabel: 'Kebijakan Perusahaan',
    ragRole: 'asisten informasi perusahaan',
    portalTitle: 'Portal Karyawan',
    enabledModules: ['residents', 'announcements', 'regulations'],
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule, { logger: ['error'] });
  const authService = app.get(AuthService);
  const domainTemplatesService = app.get(DomainTemplatesService);

  // Superadmin
  const username = process.env.SEED_SUPERADMIN_USERNAME || 'superadmin';
  const password = process.env.SEED_SUPERADMIN_PASSWORD || 'changeme123';

  try {
    await authService.createAdmin({ username, password, role: 'superadmin' });
    console.log(`✅ Superadmin created: ${username}`);
    console.log('⚠️  Change the password immediately via PATCH /auth/me/password');
  } catch (err: any) {
    if (err?.code === 11000 || err?.message?.includes('duplicate')) {
      console.log(`ℹ️  Superadmin "${username}" already exists — skipping.`);
    } else {
      console.error('❌ Seed failed:', err.message);
      process.exit(1);
    }
  }

  // Domain templates
  for (const template of DOMAIN_TEMPLATES) {
    try {
      await domainTemplatesService.create(template as any);
      console.log(`✅ Domain template created: ${template.name}`);
    } catch (err: any) {
      if (err?.code === 11000 || err?.message?.includes('duplicate')) {
        console.log(`ℹ️  Domain template "${template.name}" already exists — skipping.`);
      } else {
        console.error(`❌ Failed to seed domain template "${template.name}":`, err.message);
      }
    }
  }

  await app.close();
}

seed();
