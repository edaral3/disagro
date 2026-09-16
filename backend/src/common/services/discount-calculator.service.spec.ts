import { Test, TestingModule } from '@nestjs/testing';
import {
  DiscountCalculatorService,
  SelectedItem,
} from './discount-calculator.service';

describe('DiscountCalculatorService', () => {
  let service: DiscountCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscountCalculatorService],
    }).compile();

    service = module.get<DiscountCalculatorService>(DiscountCalculatorService);
  });

  describe('calculateDiscounts', () => {
    describe('Servicios - regla de cantidad', () => {
      it('debe retornar 0% para 0 servicios', () => {
        const items: SelectedItem[] = [];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(0);
      });

      it('debe retornar 0% para 1 servicio', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 100 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(0);
      });

      it('debe retornar 3% para exactamente 2 servicios con suma ≤ 1500', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 100 },
          { id: '2', type: 'SERVICE', price: 200 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(3);
      });

      it('debe retornar 3% para 3+ servicios con suma ≤ 1500', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 100 },
          { id: '2', type: 'SERVICE', price: 200 },
          { id: '3', type: 'SERVICE', price: 300 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(3);
      });
    });

    describe('Servicios - regla de suma > 1500', () => {
      it('debe retornar 3% para 2 servicios con suma exactamente 1500.00', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 750 },
          { id: '2', type: 'SERVICE', price: 750 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(3); // NO 5, porque 1500 es = no >
      });

      it('debe retornar 5% para 2 servicios con suma > 1500', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 750 },
          { id: '2', type: 'SERVICE', price: 750.01 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(5);
      });

      it('debe retornar 5% para 3 servicios con suma > 1500', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 600 },
          { id: '2', type: 'SERVICE', price: 600 },
          { id: '3', type: 'SERVICE', price: 310 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(5);
      });

      it('debe retornar 5% para 1 servicio altísimo (pero no cumple cantidad mínima)', () => {
        // Nota: Esta prueba verifica que la cantidad es REQUISITO PREVIO
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 5000 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(0); // 0% porque < 2 servicios
      });
    });

    describe('Productos - regla de cantidad', () => {
      it('debe retornar 0% para 0 productos', () => {
        const items: SelectedItem[] = [];
        const result = service.calculateDiscounts(items);
        expect(result.productsDiscountPct).toBe(0);
      });

      it('debe retornar 0% para 1 producto', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'PRODUCT', price: 100 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.productsDiscountPct).toBe(0);
      });

      it('debe retornar 0% para 2 productos', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'PRODUCT', price: 100 },
          { id: '2', type: 'PRODUCT', price: 200 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.productsDiscountPct).toBe(0);
      });

      it('debe retornar 3% para exactamente 3 productos', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'PRODUCT', price: 50 },
          { id: '2', type: 'PRODUCT', price: 50 },
          { id: '3', type: 'PRODUCT', price: 50 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.productsDiscountPct).toBe(3);
      });

      it('debe retornar 3% para 4 productos', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'PRODUCT', price: 25 },
          { id: '2', type: 'PRODUCT', price: 25 },
          { id: '3', type: 'PRODUCT', price: 25 },
          { id: '4', type: 'PRODUCT', price: 25 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.productsDiscountPct).toBe(3);
      });
    });

    describe('Productos - regla de 5+', () => {
      it('debe retornar 5% para exactamente 5 productos', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'PRODUCT', price: 20 },
          { id: '2', type: 'PRODUCT', price: 20 },
          { id: '3', type: 'PRODUCT', price: 20 },
          { id: '4', type: 'PRODUCT', price: 20 },
          { id: '5', type: 'PRODUCT', price: 20 },
        ];
        const result = service.calculateDiscounts(items);
        expect(result.productsDiscountPct).toBe(5);
      });

      it('debe retornar 5% para 6+ productos', () => {
        const items: SelectedItem[] = Array.from({ length: 10 }, (_, i) => ({
          id: `${i}`,
          type: 'PRODUCT' as const,
          price: 10,
        }));
        const result = service.calculateDiscounts(items);
        expect(result.productsDiscountPct).toBe(5);
      });
    });

    describe('Descuentos independientes (servicio + producto)', () => {
      it('debe calcular ambos descuentos por separado sin sumarlos', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 800 },
          { id: '2', type: 'SERVICE', price: 800 }, // suma 1600 > 1500 → 5%
          { id: '3', type: 'PRODUCT', price: 10 },
          { id: '4', type: 'PRODUCT', price: 10 },
          { id: '5', type: 'PRODUCT', price: 10 }, // 3 productos → 3%
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(5);
        expect(result.productsDiscountPct).toBe(3);
        // NO se suman: esperaría 8%, no lo hacemos
      });

      it('debe permitir 0% en una categoría y descuento en otra', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 100 }, // Solo 1 → 0%
          { id: '2', type: 'PRODUCT', price: 10 },
          { id: '3', type: 'PRODUCT', price: 10 },
          { id: '4', type: 'PRODUCT', price: 10 },
          { id: '5', type: 'PRODUCT', price: 10 },
          { id: '6', type: 'PRODUCT', price: 10 }, // 5 productos → 5%
        ];
        const result = service.calculateDiscounts(items);
        expect(result.servicesDiscountPct).toBe(0);
        expect(result.productsDiscountPct).toBe(5);
      });
    });

    describe('Casos límite de decimales', () => {
      it('debe manejar precios con centavos correctamente (suma 1500.01)', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 750.005 },
          { id: '2', type: 'SERVICE', price: 750.005 },
        ];
        const result = service.calculateDiscounts(items);
        // suma = 1500.01 > 1500 → 5%
        expect(result.servicesDiscountPct).toBe(5);
      });

      it('debe manejar precios con muchos decimales', () => {
        const items: SelectedItem[] = [
          { id: '1', type: 'SERVICE', price: 600.123 },
          { id: '2', type: 'SERVICE', price: 900.456 },
        ];
        const result = service.calculateDiscounts(items);
        // suma = 1500.579 > 1500 → 5%
        expect(result.servicesDiscountPct).toBe(5);
      });
    });

    describe('Array vacío', () => {
      it('debe retornar 0% para servicios y productos si el array está vacío', () => {
        const result = service.calculateDiscounts([]);
        expect(result.servicesDiscountPct).toBe(0);
        expect(result.productsDiscountPct).toBe(0);
      });
    });
  });
});
