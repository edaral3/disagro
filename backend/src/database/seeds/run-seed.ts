import 'reflect-metadata';
import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { RegistrationItem } from '../../registrations/entities/registration-item.entity';
import { itemsSeed } from './items.seed';

/**
 * Script de seed idempotente: solo inserta datos si la tabla `items` está vacía.
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
  const existingCount = await itemRepository.count();

  if (existingCount > 0) {
    console.log(
      `⚠ La tabla 'items' ya tiene ${existingCount} registros. Seed omitido (idempotente).`,
    );
    console.log('  Para forzar el reseed, vacía la tabla items primero.');
  } else {
    const items = itemRepository.create(itemsSeed);
    await itemRepository.save(items);
    console.log(`✓ ${items.length} ítems insertados (servicios y productos)`);
  }

  await dataSource.destroy();
  console.log('✓ Seed completado');
}

runSeed().catch((error) => {
  console.error('✗ Error ejecutando el seed:', error);
  process.exit(1);
});
