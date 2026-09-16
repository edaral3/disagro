'use client';

import { useQuery } from '@tanstack/react-query';
import { getItems, type ItemsSortOption } from '@/api/items';
import type { ItemType } from '@/types/api';
import { useDebouncedValue } from './useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 300;

export interface ItemsFilters {
  type?: ItemType;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ItemsSortOption;
}

/**
 * Lista de servicios y productos filtrada por texto y por los filtros del
 * panel (tipo, rango de precio, orden). El texto y el rango de precio se
 * debouncean (para no disparar una request por cada tecla); tipo y orden
 * se aplican de inmediato ya que no vienen de un input de texto.
 */
export function useItems(search: string, filters: ItemsFilters = {}) {
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const debouncedMinPrice = useDebouncedValue(filters.minPrice, SEARCH_DEBOUNCE_MS);
  const debouncedMaxPrice = useDebouncedValue(filters.maxPrice, SEARCH_DEBOUNCE_MS);

  const query = useQuery({
    queryKey: [
      'items',
      debouncedSearch,
      filters.type,
      debouncedMinPrice,
      debouncedMaxPrice,
      filters.sortBy,
    ],
    queryFn: () =>
      getItems({
        search: debouncedSearch || undefined,
        type: filters.type,
        minPrice: debouncedMinPrice,
        maxPrice: debouncedMaxPrice,
        sortBy: filters.sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
