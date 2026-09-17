import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';

export enum ItemType {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
}

@Entity('items')
@Index(['type'])
@Index(['active'])
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: DecimalTransformer })
  price: number;

  // simple-enum (varchar + CHECK) en vez de enum nativo: portable entre Postgres/SQLite/MySQL.
  @Column('simple-enum', { enum: ItemType })
  type: ItemType;

  @Column('varchar', { length: 100, nullable: true })
  category: string;

  @Column('boolean', { default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
