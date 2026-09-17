'use client';

import { useQuery } from '@tanstack/react-query';
import { getRegistrations, type RegistrationsSortOption } from '@/api/registrations';
import { useDebouncedValue } from './useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 300;

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
