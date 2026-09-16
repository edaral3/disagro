import { apiFetch } from './client';
import type { StartSessionResponse } from '@/types/api';

export function startSession(): Promise<StartSessionResponse> {
  return apiFetch<StartSessionResponse>('/session/start', { method: 'POST' });
}
