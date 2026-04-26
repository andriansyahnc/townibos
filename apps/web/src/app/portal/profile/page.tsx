'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clearResidentToken, getResidentToken, getResidentUser, portal, type ResidentProfile } from '@/lib/api';

export default function PortalProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const memberLabel = getResidentUser()?.memberLabel ?? 'Penghuni';

  useEffect(() => {
    if (!getResidentToken()) {
      router.replace('/portal/login');
      return;
    }
    portal.getMe()
      .then((p) => {
        setProfile(p);
        setForm({ name: p.name, email: p.email ?? '', phone: p.phone });
      })
      .catch(() => {
        clearResidentToken();
        router.replace('/portal/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await portal.updateMe({
        name: form.name || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      setProfile(updated);
      setEditing(false);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearResidentToken();
    router.replace('/portal/login');
  }

  function unitLabel(p: ResidentProfile) {
    if (!p.unitId) return '—';
    const u = p.unitId;
    return [u.block, u.floor, u.number].filter(Boolean).join('-') || '—';
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto mt-12 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profil Saya</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola informasi akun Anda</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1.5 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 2.5H3C2.72 2.5 2.5 2.72 2.5 3V12C2.5 12.28 2.72 12.5 3 12.5H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M10 5L13 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Keluar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-500 to-brand-400 h-20" />
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm flex items-center justify-center text-2xl font-bold text-brand-500">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {!editing ? (
            <div className="space-y-1">
              {[
                { label: 'Nama', value: profile.name },
                { label: 'Email', value: profile.email ?? '—' },
                { label: 'Nomor HP', value: profile.phone },
                { label: 'Unit', value: unitLabel(profile) },
                { label: 'Tipe', value: profile.role === 'owner' ? 'Pemilik' : memberLabel },
                {
                  label: 'Telegram',
                  value: profile.telegramChatId ? 'Terhubung' : 'Belum terhubung',
                  dim: !profile.telegramChatId,
                },
              ].map(({ label, value, dim }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`text-sm font-medium text-right ${dim ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {value}
                  </span>
                </div>
              ))}

              <button
                onClick={() => setEditing(true)}
                className="mt-4 w-full h-10 rounded-xl border border-brand-500 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-sm font-medium transition-colors"
              >
                Edit Profil
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {(
                [
                  { key: 'name' as const, label: 'Nama', type: 'text' },
                  { key: 'email' as const, label: 'Email', type: 'email' },
                  { key: 'phone' as const, label: 'Nomor HP', type: 'tel' },
                ] as const
              ).map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm({ name: profile.name, email: profile.email ?? '', phone: profile.phone });
                  }}
                  className="flex-1 h-10 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {!profile.telegramChatId && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20 p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Hubungkan Telegram</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Ketik <code className="bg-blue-100 dark:bg-blue-500/20 px-1 rounded">/daftar {profile.phone}</code> di bot Townibos untuk menerima notifikasi via Telegram.
          </p>
        </div>
      )}
    </div>
  );
}
