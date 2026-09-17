'use client';

import { useQuery } from '@tanstack/react-query';
import { getRegistrations, type RegistrationsSortOption } from '@/api/registrations';
import { useDebouncedValue } from './useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Lista de confirmaciones filtrada por texto (nombre/email) y ordenada por
 * fecha de confirmación. El texto se debouncea para no disparar una request
 * por cada tecla, igual que en useItems.
 */
export function useRegistrations(search: string, sortBy?: RegistrationsSortOption) {
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const query = useQuery({
    queryKey: ['registrations', debouncedSearch, sortBy],
    queryFn: () => getRegistrations({ search: debouncedSearch || undefined, sortBy }),
    placeholderData: (previousData) => previousData,
  });

  return {
    registrations: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
