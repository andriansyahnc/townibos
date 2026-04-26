import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const authService = app.get(AuthService);

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
  } finally {
    await app.close();
  }
}

seed();
