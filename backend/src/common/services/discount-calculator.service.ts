import { Injectable } from '@nestjs/common';

export interface DiscountResult {
  servicesDiscountPct: number;
  productsDiscountPct: number;
}

export interface SelectedItem {
  id: string;
  type: 'SERVICE' | 'PRODUCT';
  price: number;
}

/**
 * Servicio de dominio puro para calcular descuentos según reglas de Disagro.
 * 
 * Reglas de descuento (ver .claude/skills/disagro-rules/SKILL.md):
 * 
 * SERVICIOS:
 * - ≥2 servicios → 3% descuento
 * - ≥2 servicios AND suma de precios > Q.1,500 → 5% (reemplaza 3%)
 * 
 * PRODUCTOS:
 * - ≥3 productos → 3% descuento
 * - ≥5 productos → 5% (reemplaza 3%)
 * 
 * Los descuentos son INDEPENDIENTES (no se suman).
 * El umbral de Q.1,500 es estrictamente mayor (> 1500, no >= 1500).
 */
@Injectable()
export class DiscountCalculatorService {
  /**
   * Calcula los descuentos independientes para servicios y productos.
   * @param items Lista de ítems seleccionados con id, type, price
   * @returns Objeto con servicesDiscountPct y productsDiscountPct
   */
  calculateDiscounts(items: SelectedItem[]): DiscountResult {
    const services = items.filter((i) => i.type === 'SERVICE');
    const products = items.filter((i) => i.type === 'PRODUCT');

    return {
      servicesDiscountPct: this.calculateServiceDiscount(services),
      productsDiscountPct: this.calculateProductDiscount(products),
    };
  }

  /**
   * Calcula descuento para servicios.
   * Regla 1: ≥2 servicios → 3%
   * Regla 2: ≥2 servicios AND suma > 1500 → 5% (reemplaza 3%)
   */
  private calculateServiceDiscount(services: SelectedItem[]): number {
    if (services.length < 2) {
      return 0;
    }

    const sum = services.reduce((total, s) => total + Number(s.price), 0);

    if (sum > 1500) {
      return 5;
    }

    return 3;
  }

  /**
   * Calcula descuento para productos.
   * Regla 1: ≥3 productos → 3%
   * Regla 2: ≥5 productos → 5% (reemplaza 3%)
   */
  private calculateProductDiscount(products: SelectedItem[]): number {
    if (products.length >= 5) {
      return 5;
    }

    if (products.length >= 3) {
      return 3;
    }

    return 0;
  }
}
