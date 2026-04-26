'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { portal } from '@/lib/api';

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await portal.requestLink(email);
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message ?? 'Gagal mengirim link');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-500/10 mb-5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 13L10 19L22 7" stroke="#12b76a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cek email Anda</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Kami mengirimkan link masuk ke{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.{' '}
          Link berlaku selama 15 menit.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(''); }}
          className="mt-6 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Kirim ulang dengan email lain
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Masuk ke Portal</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Masukkan email Anda, kami akan kirimkan link masuk
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              autoFocus
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full h-11 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
