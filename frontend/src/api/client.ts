import type { ApiErrorResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// `status` permite reaccionar distinto según el código (401, 409, etc.) sin parsear el mensaje.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorResponse | null,
  ) {
    super(
      Array.isArray(body?.message)
        ? body.message.join(', ')
        : body?.message ?? `Error HTTP ${status}`,
    );
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string;
}

export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorBody: ApiErrorResponse | null = null;
    try {
      errorBody = await res.json();
    } catch {
      // El backend siempre responde JSON en error, pero por si acaso.
    }
    throw new ApiError(res.status, errorBody);
  }

  // Algunos endpoints podrían no traer body (no es el caso hoy, pero es defensivo).
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
