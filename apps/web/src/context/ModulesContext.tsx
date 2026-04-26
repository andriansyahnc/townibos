'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getToken } from '@/lib/api';

interface ModulesContextType {
  enabledModules: string[];
  isModuleEnabled: (slug: string) => boolean;
}

const ModulesContext = createContext<ModulesContextType>({
  enabledModules: [],
  isModuleEnabled: () => false,
});

export function ModulesProvider({ children }: { children: React.ReactNode }) {
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const payload = jwtDecode<{ role?: string; enabledModules?: string[] }>(token);
      setEnabledModules(payload.enabledModules ?? []);
    } catch {
      setEnabledModules([]);
    }
  }, []);

  function isModuleEnabled(slug: string): boolean {
    return enabledModules.includes('*') || enabledModules.includes(slug);
  }

  return (
    <ModulesContext.Provider value={{ enabledModules, isModuleEnabled }}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules() {
  return useContext(ModulesContext);
}
