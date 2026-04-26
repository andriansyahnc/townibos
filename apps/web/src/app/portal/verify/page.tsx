'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { portal, setResidentToken, setResidentUser } from '@/lib/api';

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Token tidak ditemukan di URL.');
      return;
    }

    portal.verify(token)
      .then(({ access_token }) => {
        setResidentToken(access_token);
        const payload = jwtDecode<{
          sub: string;
          townId?: string;
          memberLabel?: string;
          portalTitle?: string;
          enabledModules?: string[];
        }>(access_token);
        setResidentUser({
          id: payload.sub,
          townId: payload.townId,
          memberLabel: payload.memberLabel,
          portalTitle: payload.portalTitle,
          enabledModules: payload.enabledModules,
        });
        router.replace('/portal/profile');
      })
      .catch((err) => {
        setError((err as Error).message ?? 'Link tidak valid atau sudah kedaluwarsa.');
      });
  }, [params, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-error-50 dark:bg-error-500/10 mb-5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="13" cy="13" r="10" stroke="#f04438" strokeWidth="1.5" />
            <path d="M13 8V13M13 17.5V18" stroke="#f04438" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Link tidak valid</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <a href="/portal/login" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
          Minta link baru
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 mb-5">
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="#465fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Memverifikasi link, harap tunggu…</p>
    </div>
  );
}

export default function PortalVerifyPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto mt-16 text-center">
        <p className="text-sm text-gray-400">Memuat…</p>
      </div>
    }>
      <VerifyInner />
    </Suspense>
  );
}
