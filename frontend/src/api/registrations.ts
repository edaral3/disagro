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

export type RegistrationsSortOption = 'createdAt_asc' | 'createdAt_desc';

export interface GetRegistrationsParams {
  search?: string;
  sortBy?: RegistrationsSortOption;
}

export function getRegistrations(
  params: GetRegistrationsParams = {},
): Promise<RegistrationResponse[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  const qs = query.toString();
  return apiFetch<RegistrationResponse[]>(`/registrations${qs ? `?${qs}` : ''}`);
}
