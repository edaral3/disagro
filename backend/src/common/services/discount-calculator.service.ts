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

@Injectable()
export class DiscountCalculatorService {
  calculateDiscounts(items: SelectedItem[]): DiscountResult {
    const services = items.filter((i) => i.type === 'SERVICE');
    const products = items.filter((i) => i.type === 'PRODUCT');

    return {
      servicesDiscountPct: this.calculateServiceDiscount(services),
      productsDiscountPct: this.calculateProductDiscount(products),
    };
  }

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
