'use client';

import { getResidentUser } from '@/lib/api';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = typeof window !== 'undefined' ? getResidentUser() : null;
  const portalTitle = user?.portalTitle ?? 'Portal';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1L1 4V13H13V4L7 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M5 13V9H9V13" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-800 dark:text-white">Townibos</span>
        <span className="text-xs text-gray-400 ml-1">{portalTitle}</span>
      </div>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}
