import { apiFetch } from './client';
import type { Item, ItemType } from '@/types/api';

export type ItemsSortOption = 'price_asc' | 'price_desc';

export interface GetItemsParams {
  search?: string;
  type?: ItemType;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ItemsSortOption;
}

export function getItems(params: GetItemsParams = {}): Promise<Item[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.type) query.set('type', params.type);
  if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  const qs = query.toString();
  return apiFetch<Item[]>(`/items${qs ? `?${qs}` : ''}`);
}
