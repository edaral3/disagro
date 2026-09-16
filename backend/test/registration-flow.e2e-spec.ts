import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as request from 'supertest';

import { ItemsModule } from '../src/items/items.module';
import { RegistrationsModule } from '../src/registrations/registrations.module';
import { SessionModule } from '../src/session/session.module';
import { Item, ItemType } from '../src/items/entities/item.entity';
import { Registration } from '../src/registrations/entities/registration.entity';
import { RegistrationItem } from '../src/registrations/entities/registration-item.entity';

/**
 * E2E del flujo completo: session -> items -> registration.
 * Usa SQLite en memoria (no requiere Docker/Postgres) para poder validar
 * el wiring real de módulos (CQRS, guards, DI) y las reglas de descuento
 * de extremo a extremo, tal como las expone la API HTTP.
 *
 * Nota: la búsqueda por texto de GET /items usa ILIKE (específico de
 * Postgres) y no se ejercita aquí por esa razón; el resto del contrato
 * HTTP sí se valida end-to-end.
 */
describe('Registration flow (e2e)', () => {
  let app: INestApplication;
  let itemIds: Record<string, string>;

  // String a propósito (así llega process.env.JWT_EXPIRATION en la app real) —
  // ver la nota en app.module.ts: un numeral sin unidad pasado como STRING a
  // jsonwebtoken se interpreta como milisegundos vía la librería `ms`, no
  // segundos, colapsando a una duración ~0 si no se envuelve en Number().
  process.env.JWT_EXPIRATION = '2';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          driver: require('better-sqlite3'),
          dropSchema: true,
          entities: [Item, Registration, RegistrationItem],
          synchronize: true,
        }),
        JwtModule.registerAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          // Mismo patrón que AppModule (incl. el Number() que corrige el bug
          // de arriba) para que este test ejercite la ruta real, no una
          // versión simplificada que nunca hubiera detectado la regresión.
          useFactory: (configService: ConfigService) => ({
            secret: 'test-secret',
            signOptions: {
              expiresIn: Number(configService.get('JWT_EXPIRATION', 1800)),
            },
          }),
        }),
        ItemsModule,
        RegistrationsModule,
        SessionModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Seed de ítems de prueba directamente vía repository
    const dataSource = app.get(DataSource);
    const repo = dataSource.getRepository(Item);

    const seeded = await repo.save([
      { name: 'Servicio A', price: 800, type: ItemType.SERVICE, active: true },
      { name: 'Servicio B', price: 800, type: ItemType.SERVICE, active: true },
      { name: 'Servicio C', price: 100, type: ItemType.SERVICE, active: true },
      { name: 'Servicio Inactivo', price: 999, type: ItemType.SERVICE, active: false },
      { name: 'Producto A', price: 10, type: ItemType.PRODUCT, active: true },
      { name: 'Producto B', price: 10, type: ItemType.PRODUCT, active: true },
      { name: 'Producto C', price: 10, type: ItemType.PRODUCT, active: true },
      { name: 'Producto D', price: 10, type: ItemType.PRODUCT, active: true },
      { name: 'Producto E', price: 10, type: ItemType.PRODUCT, active: true },
    ]);

    itemIds = {
      serviceA: seeded[0].id,
      serviceB: seeded[1].id,
      serviceC: seeded[2].id,
      serviceInactive: seeded[3].id,
      productA: seeded[4].id,
      productB: seeded[5].id,
      productC: seeded[6].id,
      productD: seeded[7].id,
      productE: seeded[8].id,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  async function getSessionToken(): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/session/start')
      .expect(200);
    expect(res.body.token).toBeDefined();
    return res.body.token;
  }

  function decodeJwtPayload(token: string): { iat: number; exp: number } {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString());
  }

  describe('Sesión: expiración real del JWT (regresión)', () => {
    it('POST /api/session/start emite un token cuyo exp está exactamente JWT_EXPIRATION segundos después de iat', async () => {
      const token = await getSessionToken();
      const { iat, exp } = decodeJwtPayload(token);
      // JWT_EXPIRATION='2' (string, como llega de una env var real).
      expect(exp - iat).toBe(2);
    });

    it('expiresIn en la respuesta coincide con la duración real del token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/session/start')
        .expect(200);
      const { iat, exp } = decodeJwtPayload(res.body.token);
      expect(res.body.expiresIn).toBe(2);
      expect(exp - iat).toBe(res.body.expiresIn);
    });

    it('un token ya expirado es rechazado por SessionGuard (401)', async () => {
      const token = await getSessionToken();
      // Esperar más que JWT_EXPIRATION (2s) para que el token expire de verdad.
      await new Promise((resolve) => setTimeout(resolve, 2500));

      await request(app.getHttpServer())
        .post('/api/registrations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Expirado',
          lastName: 'Test',
          email: 'expirado@example.com',
          eventDateTime: '2099-01-01T10:00:00Z',
          selectedItemIds: [itemIds.productA],
        })
        .expect(401);
    }, 10000);
  });

  it('GET /api/items lists only active items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/items')
      .expect(200);

    const names = res.body.map((i: any) => i.name);
    expect(names).not.toContain('Servicio Inactivo');
    expect(res.body.length).toBe(8);
  });

  it('GET /api/items?type=SERVICE filters by type', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/items?type=SERVICE')
      .expect(200);
    expect(res.body.every((i: any) => i.type === 'SERVICE')).toBe(true);
  });

  it('GET /api/items?minPrice=&maxPrice= filters by price range (inclusive)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/items?minPrice=50&maxPrice=900')
      .expect(200);
    const names = res.body.map((i: any) => i.name).sort();
    expect(names).toEqual(['Servicio A', 'Servicio B', 'Servicio C']);
  });

  it('GET /api/items?sortBy=price_asc orders ascending by price', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/items?sortBy=price_asc')
      .expect(200);
    const prices = res.body.map((i: any) => i.price);
    expect(prices[0]).toBe(10);
    expect(prices[prices.length - 1]).toBe(800);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('GET /api/items?sortBy=price_desc orders descending by price', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/items?sortBy=price_desc')
      .expect(200);
    const prices = res.body.map((i: any) => i.price);
    expect(prices[0]).toBe(800);
    expect(prices[prices.length - 1]).toBe(10);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('GET /api/items?minPrice=abc rejects a non-numeric price with 400', async () => {
    await request(app.getHttpServer()).get('/api/items?minPrice=abc').expect(400);
  });

  it('POST /api/registrations without token returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/registrations')
      .send({
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [itemIds.productA],
      })
      .expect(401);
  });

  it('POST /api/registrations with 2 services summing >1500 gives 5% services discount', async () => {
    const token = await getSessionToken();

    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana.lopez@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [itemIds.serviceA, itemIds.serviceB], // 800+800=1600 > 1500
      })
      .expect(201);

    expect(res.body.servicesDiscountPct).toBe(5);
    expect(res.body.productsDiscountPct).toBe(0);
    expect(res.body.items).toHaveLength(2);
  });

  it('POST /api/registrations with exactly 5 products gives 5% products discount', async () => {
    const token = await getSessionToken();

    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Carlos',
        lastName: 'Ruiz',
        email: 'carlos.ruiz@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [
          itemIds.productA,
          itemIds.productB,
          itemIds.productC,
          itemIds.productD,
          itemIds.productE,
        ],
      })
      .expect(201);

    expect(res.body.servicesDiscountPct).toBe(0);
    expect(res.body.productsDiscountPct).toBe(5);
  });

  it('POST /api/registrations rejects duplicate email with 409', async () => {
    const token = await getSessionToken();

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Ana',
        lastName: 'Otra',
        email: 'ana.lopez@example.com', // mismo email del test anterior
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [itemIds.productA],
      })
      .expect(409);
  });

  it('POST /api/registrations rejects duplicate email case-insensitively', async () => {
    const token = await getSessionToken();

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Ana',
        lastName: 'Mayus',
        email: 'ANA.LOPEZ@EXAMPLE.COM', // mismo email, distinto casing
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [itemIds.productA],
      })
      .expect(409);
  });

  it('POST /api/registrations rejects a past eventDateTime with 400', async () => {
    const token = await getSessionToken();

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Pedro',
        lastName: 'Gomez',
        email: 'pedro@example.com',
        eventDateTime: '2020-01-01T10:00:00Z',
        selectedItemIds: [itemIds.productA],
      })
      .expect(400);
  });

  it('POST /api/registrations rejects an inactive item with 404', async () => {
    const token = await getSessionToken();

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Luis',
        lastName: 'Diaz',
        email: 'luis@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [itemIds.serviceInactive],
      })
      .expect(404);
  });

  it('POST /api/registrations rejects a non-existent item id with 404', async () => {
    const token = await getSessionToken();

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Sofia',
        lastName: 'Mora',
        email: 'sofia@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: ['00000000-0000-4000-8000-000000000000'],
      })
      .expect(404);
  });

  it('POST /api/registrations rejects duplicate item ids in the same request with 400', async () => {
    const token = await getSessionToken();

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Duplicado',
        lastName: 'Item',
        email: 'duplicado@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [itemIds.productA, itemIds.productA],
      })
      .expect(400);
  });

  it('POST /api/registrations rejects empty selectedItemIds with 400', async () => {
    const token = await getSessionToken();

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Vacio',
        lastName: 'Test',
        email: 'vacio@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [],
      })
      .expect(400);
  });

  it('GET /api/registrations/:id returns full details after creation', async () => {
    const token = await getSessionToken();

    const createRes = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Maria',
        lastName: 'Fernandez',
        email: 'maria.fernandez@example.com',
        eventDateTime: '2099-01-01T10:00:00Z',
        selectedItemIds: [itemIds.serviceC],
      })
      .expect(201);

    const getRes = await request(app.getHttpServer())
      .get(`/api/registrations/${createRes.body.id}`)
      .expect(200);

    expect(getRes.body.email).toBe('maria.fernandez@example.com');
    expect(getRes.body.items).toHaveLength(1);
  });

  it('GET /api/registrations/:id returns 404 for a well-formed but unknown UUID', async () => {
    await request(app.getHttpServer())
      .get('/api/registrations/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('GET /api/registrations/:id returns 400 for a malformed id', async () => {
    await request(app.getHttpServer())
      .get('/api/registrations/not-a-uuid')
      .expect(400);
  });
});
