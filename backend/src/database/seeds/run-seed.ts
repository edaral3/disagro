import 'reflect-metadata';
import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { RegistrationItem } from '../../registrations/entities/registration-item.entity';
import { itemsSeed } from './items.seed';

/**
 * Script de seed idempotente por ítem: inserta solo los ítems de
 * `itemsSeed` que no existan ya (comparando por `name`), sin duplicar ni
 * tocar los que ya están. Esto permite agregar ítems nuevos a
 * `items.seed.ts` y volver a correr `npm run db:seed` en una base ya
 * sembrada sin necesidad de vaciarla primero.
 * Uso: npm run db:seed (ver package.json)
 */
async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Item, Registration, RegistrationItem],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('✓ Conectado a la base de datos');

  const itemRepository = dataSource.getRepository(Item);
  const existingNames = new Set(
    (await itemRepository.find({ select: ['name'] })).map((i) => i.name),
  );

  const missingItems = itemsSeed.filter((seed) => !existingNames.has(seed.name));

  if (missingItems.length === 0) {
    console.log(
      `⚠ Los ${itemsSeed.length} ítems de items.seed.ts ya existen en la base. Nada que insertar.`,
    );
  } else {
    const items = itemRepository.create(missingItems);
    await itemRepository.save(items);
    console.log(
      `✓ ${items.length} ítem(s) nuevo(s) insertado(s): ${missingItems.map((i) => i.name).join(', ')}`,
    );
    if (existingNames.size > 0) {
      console.log(`  (${existingNames.size} ítem(s) ya existentes se dejaron sin tocar)`);
    }
  }

  await dataSource.destroy();
  console.log('✓ Seed completado');
}

runSeed().catch((error) => {
  console.error('✗ Error ejecutando el seed:', error);
  process.exit(1);
});
