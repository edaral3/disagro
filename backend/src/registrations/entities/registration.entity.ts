import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RegistrationItem } from './registration-item.entity';

@Entity('registrations')
@Index(['createdAt'])
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  firstName: string;

  @Column('varchar', { length: 100 })
  lastName: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column()
  eventDateTime: Date;

  @Column('smallint', { default: 0 })
  servicesDiscountPct: number;

  @Column('smallint', { default: 0 })
  productsDiscountPct: number;

  @OneToMany(
    () => RegistrationItem,
    (item) => item.registration,
    { cascade: true, eager: true },
  )
  items: RegistrationItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
