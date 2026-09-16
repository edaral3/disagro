import { apiFetch } from './client';
import type { CreateRegistrationRequest, RegistrationResponse } from '@/types/api';

export function createRegistration(
  data: CreateRegistrationRequest,
  token: string,
): Promise<RegistrationResponse> {
  return apiFetch<RegistrationResponse>('/registrations', {
    method: 'POST',
    body: data,
    token,
  });
}

export function getRegistration(id: string): Promise<RegistrationResponse> {
  return apiFetch<RegistrationResponse>(`/registrations/${id}`);
}
