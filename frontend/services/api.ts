// Frontend API Client with Automatic JWT Injection and Error Handling

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UserProfile {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'Admin' | 'Researcher' | 'Forest Officer';
  badge_number?: string;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wildtrack_token');
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('wildtrack_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wildtrack_token', token);
  localStorage.setItem('wildtrack_user', JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('wildtrack_token');
  localStorage.removeItem('wildtrack_user');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new Error(`Cannot reach WildTrack backend at ${url}. Please ensure Flask server is running on port 5000.`);
  }

  if (response.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?msg=session_expired';
    }
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}
