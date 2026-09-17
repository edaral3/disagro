'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { startSession } from '@/api/session';

const STORAGE_KEY = 'disagro.session';
// Margen de seguridad: pedimos un token nuevo un poco antes de que expire
// de verdad, para no arriesgarnos a que expire a mitad de un submit.
const EXPIRY_SAFETY_MARGIN_MS = 30_000;

interface StoredSession {
  token: string;
  expiresAt: number; // epoch ms
}

function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (Date.now() > parsed.expiresAt - EXPIRY_SAFETY_MARGIN_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage puede fallar (modo privado, cuota); la sesión igual
    // funciona en memoria para esta carga de página.
  }
}

export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const cached = readStoredSession();
      if (cached) return cached;

      const { token, expiresIn } = await startSession();
      const session: StoredSession = {
        token,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      writeStoredSession(session);
      return session;
    },
    staleTime: Infinity,
    retry: 1,
  });

  const refresh = useCallback(async (): Promise<string> => {
    const { token, expiresIn } = await startSession();
    const session: StoredSession = {
      token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    writeStoredSession(session);
    queryClient.setQueryData(['session'], session);
    return token;
  }, [queryClient]);

  return {
    token: query.data?.token,
    isLoading: query.isLoading,
    error: query.error,
    refresh,
  };
}
