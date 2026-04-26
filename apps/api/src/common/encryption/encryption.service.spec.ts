import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

const VALID_KEY = 'a'.repeat(64);

function makeService(key: string) {
  return Test.createTestingModule({
    providers: [
      EncryptionService,
      { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(key) } },
    ],
  })
    .compile()
    .then((m) => m.get(EncryptionService));
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    service = await makeService(VALID_KEY);
  });

  it('encrypt returns a colon-separated hex string with 3 parts', () => {
    const result = service.encrypt('hello');
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12-byte IV → 24 hex chars
    expect(parts[1]).toHaveLength(32); // 16-byte tag → 32 hex chars
  });

  it('decrypt recovers the original plaintext', () => {
    const plaintext = 'secret_notion_key_abc123';
    expect(service.decrypt(service.encrypt(plaintext))).toBe(plaintext);
  });

  it('produces different ciphertext each call due to random IV', () => {
    const a = service.encrypt('same');
    const b = service.encrypt('same');
    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe('same');
    expect(service.decrypt(b)).toBe('same');
  });

  it('throws on tampered ciphertext', () => {
    const ct = service.encrypt('data');
    const parts = ct.split(':');
    parts[2] = parts[2].replace(/.$/, parts[2].endsWith('0') ? '1' : '0');
    expect(() => service.decrypt(parts.join(':'))).toThrow();
  });

  it('throws when ENCRYPTION_KEY is missing', async () => {
    await expect(makeService('')).rejects.toThrow(
      'ENCRYPTION_KEY must be a 64-character hex string',
    );
  });

  it('throws when ENCRYPTION_KEY is wrong length', async () => {
    await expect(makeService('deadbeef')).rejects.toThrow(
      'ENCRYPTION_KEY must be a 64-character hex string',
    );
  });
});
