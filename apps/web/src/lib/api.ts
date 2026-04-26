const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getUser(): { id: string; username: string; role: string; townId?: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: object) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const auth = {
  login: (username: string, password: string) =>
    request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// Domain Templates
export type DomainTemplate = {
  _id: string;
  name: string;
  slug: string;
  memberLabel: string;
  assetLabel: string;
  documentLabel: string;
  ragRole: string;
  portalTitle: string;
  enabledModules: string[];
};

export const domainTemplates = {
  list: () => request<DomainTemplate[]>('/domain-templates'),
  registry: () => request<{ slug: string; name: string; availableFor: string[] | string }[]>('/domain-templates/registry'),
  create: (dto: Omit<DomainTemplate, '_id'>) =>
    request<DomainTemplate>('/domain-templates', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: Partial<Omit<DomainTemplate, '_id'>>) =>
    request<DomainTemplate>(`/domain-templates/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) =>
    request<{ deleted: boolean }>(`/domain-templates/${id}`, { method: 'DELETE' }),
};

// Towns
export type Town = {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  isActive: boolean;
  notionDatabaseId?: string;
  domainTemplateId?: DomainTemplate | string | null;
};

export const towns = {
  list: () => request<Town[]>('/towns'),
  create: (dto: Partial<Town> & { notionApiKey?: string }) =>
    request<Town>('/towns', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: Partial<Town> & { notionApiKey?: string }) =>
    request<Town>(`/towns/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) => request<{ deleted: boolean }>(`/towns/${id}`, { method: 'DELETE' }),
  syncNotion: (id: string) =>
    request<{ synced: number; errors: number }>(`/notion/sync/${id}`, { method: 'POST' }),
};

// Admin users
export type AdminUser = {
  _id: string;
  username: string;
  role: 'superadmin' | 'admin';
  townId?: string;
};

// Residents
export type Resident = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'owner' | 'tenant';
  isActive: boolean;
  townId: string;
  telegramChatId?: string;
  unitId?: { _id: string; block?: string; floor?: string; number?: string } | null;
};

export const residents = {
  list: (townId?: string) =>
    request<Resident[]>(`/residents${townId ? `?townId=${townId}` : ''}`),
  update: (id: string, dto: Partial<Resident>) =>
    request<Resident>(`/residents/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) =>
    request<{ deleted: boolean }>(`/residents/${id}`, { method: 'DELETE' }),
};

// Resident portal (separate token from admin)
const RESIDENT_TOKEN_KEY = 'resident_token';

export function getResidentToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(RESIDENT_TOKEN_KEY);
}

export function setResidentToken(token: string) {
  localStorage.setItem(RESIDENT_TOKEN_KEY, token);
}

export function clearResidentToken() {
  localStorage.removeItem(RESIDENT_TOKEN_KEY);
  localStorage.removeItem('resident');
}

export type ResidentUser = {
  id: string;
  townId?: string;
  memberLabel?: string;
  portalTitle?: string;
  enabledModules?: string[];
};

export function getResidentUser(): ResidentUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('resident');
  return raw ? JSON.parse(raw) : null;
}

export function setResidentUser(user: ResidentUser) {
  localStorage.setItem('resident', JSON.stringify(user));
}

async function residentRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getResidentToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type ResidentProfile = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isActive: boolean;
  townId: string;
  telegramChatId?: string;
  unitId?: { _id: string; block?: string; floor?: string; number?: string } | null;
};

export const portal = {
  requestLink: (email: string) =>
    request<{ sent: boolean }>('/residents/portal/request-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verify: (token: string) =>
    request<{ access_token: string }>(`/residents/portal/verify?token=${encodeURIComponent(token)}`),
  getMe: () => residentRequest<ResidentProfile>('/residents/portal/me'),
  updateMe: (dto: { name?: string; email?: string; phone?: string }) =>
    residentRequest<ResidentProfile>('/residents/portal/me', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
};

// RAG
export const rag = {
  query: (question: string, townId: string) =>
    request<{ answer: string }>('/rag/query', {
      method: 'POST',
      body: JSON.stringify({ question, townId }),
    }),
  refresh: (townId?: string) =>
    request<{ refreshed: boolean; townId: string }>('/rag/refresh', {
      method: 'POST',
      body: JSON.stringify({ townId }),
    }),
};

export const users = {
  list: () => request<AdminUser[]>('/auth/admins'),
  create: (dto: { username: string; password: string; role: string; townId?: string }) =>
    request<AdminUser>('/auth/admins', { method: 'POST', body: JSON.stringify(dto) }),
  changePassword: (id: string, newPassword: string) =>
    request<void>(`/auth/admins/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),
  remove: (id: string) => request<{ deleted: boolean }>(`/auth/admins/${id}`, { method: 'DELETE' }),
};

// Scores
export type Score = {
  _id: string;
  townId: string;
  residentId: string | { _id: string; name: string };
  subject: string;
  period: string;
  score: number;
  type: 'daily' | 'mid' | 'final';
  notes?: string;
};

export const scores = {
  list: (residentId?: string) =>
    request<Score[]>(`/scores${residentId ? `?residentId=${residentId}` : ''}`),
  byResident: (residentId: string) => request<Score[]>(`/scores/resident/${residentId}`),
  create: (dto: Omit<Score, '_id' | 'townId'>) =>
    request<Score>('/scores', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: Partial<Omit<Score, '_id' | 'townId'>>) =>
    request<Score>(`/scores/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) => request<{ deleted: boolean }>(`/scores/${id}`, { method: 'DELETE' }),
};

// Guardians
export type Guardian = {
  _id: string;
  townId: string;
  studentId: string | { _id: string; name: string };
  name: string;
  phone: string;
  email?: string;
  relationship: string;
};

export const guardians = {
  list: () => request<Guardian[]>('/guardians'),
  byStudent: (studentId: string) => request<Guardian[]>(`/guardians/student/${studentId}`),
  create: (dto: Omit<Guardian, '_id' | 'townId'>) =>
    request<Guardian>('/guardians', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: Partial<Omit<Guardian, '_id' | 'townId'>>) =>
    request<Guardian>(`/guardians/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) => request<{ deleted: boolean }>(`/guardians/${id}`, { method: 'DELETE' }),
};
