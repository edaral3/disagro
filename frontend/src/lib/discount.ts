import type { ItemType } from '@/types/api';

export interface SelectedItemForDiscount {
  id: string;
  type: ItemType;
  price: number;
}

export interface DiscountPreview {
  servicesDiscountPct: number;
  productsDiscountPct: number;
}

// Espejo de discount-calculator.service.ts (backend) solo para previsualización;
// el backend sigue siendo la fuente de verdad al confirmar — mantener ambos en sync.
export function calculateDiscountPreview(
  items: SelectedItemForDiscount[],
): DiscountPreview {
  const services = items.filter((i) => i.type === 'SERVICE');
  const products = items.filter((i) => i.type === 'PRODUCT');

  return {
    servicesDiscountPct: calculateServiceDiscount(services),
    productsDiscountPct: calculateProductDiscount(products),
  };
}

function calculateServiceDiscount(services: SelectedItemForDiscount[]): number {
  if (services.length < 2) return 0;
  const sum = services.reduce((total, s) => total + s.price, 0);
  return sum > 1500 ? 5 : 3;
}

function calculateProductDiscount(products: SelectedItemForDiscount[]): number {
  if (products.length >= 5) return 5;
  if (products.length >= 3) return 3;
  return 0;
}
