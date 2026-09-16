import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Registration } from './registration.entity';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('registration_items')
export class RegistrationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  registrationId: string;

  @Column('uuid')
  itemId: string;

  @Column('varchar', { length: 50 })
  itemType: 'SERVICE' | 'PRODUCT';

  @Column('decimal', { precision: 10, scale: 2, transformer: DecimalTransformer })
  priceSnapshot: number;

  @ManyToOne(() => Registration, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registrationId' })
  registration: Registration;
}
