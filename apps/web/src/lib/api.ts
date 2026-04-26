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

// Towns
export type Town = {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  isActive: boolean;
  notionDatabaseId?: string;
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
