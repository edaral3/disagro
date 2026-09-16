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

/**
 * Espejo puro de backend/src/common/services/discount-calculator.service.ts.
 * Se usa SOLO para la previsualización en vivo mientras el cliente
 * selecciona ítems; el cálculo autoritativo (el que se persiste) siempre
 * lo hace el backend al confirmar. Ver .claude/skills/disagro-rules/SKILL.md
 * para las reglas exactas — mantener ambas implementaciones en sync.
 *
 * Servicios: ≥2 → 3%; ≥2 y suma > Q.1500 → 5% (reemplaza el 3%).
 * Productos: ≥3 → 3%; ≥5 → 5% (reemplaza el 3%).
 */
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
