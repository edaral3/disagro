import { calculateDiscountPreview, SelectedItemForDiscount } from './discount';

/**
 * Mismos casos que backend/src/common/services/discount-calculator.service.spec.ts
 * — este archivo existe para garantizar paridad entre el preview del
 * frontend y la fuente de verdad del backend, no para revalidar las reglas
 * de negocio en sí (eso ya lo cubre la suite del backend).
 */
describe('calculateDiscountPreview', () => {
  describe('Servicios', () => {
    it('0 servicios -> 0%', () => {
      expect(calculateDiscountPreview([]).servicesDiscountPct).toBe(0);
    });

    it('1 servicio -> 0%', () => {
      const items: SelectedItemForDiscount[] = [
        { id: '1', type: 'SERVICE', price: 100 },
      ];
      expect(calculateDiscountPreview(items).servicesDiscountPct).toBe(0);
    });

    it('2 servicios con suma <= 1500 -> 3%', () => {
      const items: SelectedItemForDiscount[] = [
        { id: '1', type: 'SERVICE', price: 100 },
        { id: '2', type: 'SERVICE', price: 200 },
      ];
      expect(calculateDiscountPreview(items).servicesDiscountPct).toBe(3);
    });

    it('2 servicios con suma exactamente 1500 -> 3% (no 5%)', () => {
      const items: SelectedItemForDiscount[] = [
        { id: '1', type: 'SERVICE', price: 750 },
        { id: '2', type: 'SERVICE', price: 750 },
      ];
      expect(calculateDiscountPreview(items).servicesDiscountPct).toBe(3);
    });

    it('2 servicios con suma > 1500 -> 5%', () => {
      const items: SelectedItemForDiscount[] = [
        { id: '1', type: 'SERVICE', price: 750 },
        { id: '2', type: 'SERVICE', price: 750.01 },
      ];
      expect(calculateDiscountPreview(items).servicesDiscountPct).toBe(5);
    });

    it('1 servicio de precio alto no cumple la cantidad mínima -> 0%', () => {
      const items: SelectedItemForDiscount[] = [
        { id: '1', type: 'SERVICE', price: 5000 },
      ];
      expect(calculateDiscountPreview(items).servicesDiscountPct).toBe(0);
    });
  });

  describe('Productos', () => {
    it('0, 1 o 2 productos -> 0%', () => {
      for (let n = 0; n <= 2; n++) {
        const items: SelectedItemForDiscount[] = Array.from(
          { length: n },
          (_, i) => ({ id: `${i}`, type: 'PRODUCT' as const, price: 10 }),
        );
        expect(calculateDiscountPreview(items).productsDiscountPct).toBe(0);
      }
    });

    it('exactamente 3 productos -> 3%', () => {
      const items: SelectedItemForDiscount[] = Array.from(
        { length: 3 },
        (_, i) => ({ id: `${i}`, type: 'PRODUCT' as const, price: 10 }),
      );
      expect(calculateDiscountPreview(items).productsDiscountPct).toBe(3);
    });

    it('4 productos -> 3% (no alcanza el umbral de 5)', () => {
      const items: SelectedItemForDiscount[] = Array.from(
        { length: 4 },
        (_, i) => ({ id: `${i}`, type: 'PRODUCT' as const, price: 10 }),
      );
      expect(calculateDiscountPreview(items).productsDiscountPct).toBe(3);
    });

    it('exactamente 5 productos -> 5%', () => {
      const items: SelectedItemForDiscount[] = Array.from(
        { length: 5 },
        (_, i) => ({ id: `${i}`, type: 'PRODUCT' as const, price: 10 }),
      );
      expect(calculateDiscountPreview(items).productsDiscountPct).toBe(5);
    });
  });

  describe('Independencia entre servicios y productos', () => {
    it('calcula ambos descuentos por separado, sin sumarlos', () => {
      const items: SelectedItemForDiscount[] = [
        { id: '1', type: 'SERVICE', price: 800 },
        { id: '2', type: 'SERVICE', price: 800 }, // suma 1600 > 1500 -> 5%
        { id: '3', type: 'PRODUCT', price: 10 },
        { id: '4', type: 'PRODUCT', price: 10 },
        { id: '5', type: 'PRODUCT', price: 10 }, // 3 productos -> 3%
      ];
      const result = calculateDiscountPreview(items);
      expect(result.servicesDiscountPct).toBe(5);
      expect(result.productsDiscountPct).toBe(3);
    });
  });
});
