'use client';

import { useMutation } from '@tanstack/react-query';
import { createRegistration } from '@/api/registrations';
import { ApiError } from '@/api/client';
import type { CreateRegistrationRequest, RegistrationResponse } from '@/types/api';
import { useSession } from './useSession';

interface UseCreateRegistrationOptions {
  onSuccess?: (data: RegistrationResponse) => void;
}

/**
 * Envía la confirmación de asistencia. Si el token de sesión expiró justo
 * en medio del llenado del formulario (401), pide uno nuevo una sola vez
 * y reintenta automáticamente antes de reportar el error al usuario.
 */
export function useCreateRegistration(options: UseCreateRegistrationOptions = {}) {
  const { token, refresh } = useSession();

  const mutation = useMutation<RegistrationResponse, ApiError, CreateRegistrationRequest>({
    mutationFn: async (data) => {
      const currentToken = token ?? (await refresh());
      try {
        return await createRegistration(data, currentToken);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          const freshToken = await refresh();
          return await createRegistration(data, freshToken);
        }
        throw error;
      }
    },
    onSuccess: options.onSuccess,
  });

  return mutation;
}
