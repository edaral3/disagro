import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateRegistrationCommand } from '../impl/create-registration.command';
import { Registration } from '../../entities/registration.entity';
import { RegistrationItem } from '../../entities/registration-item.entity';
import { Item } from '../../../items/entities/item.entity';
import { DiscountCalculatorService } from '../../../common/services/discount-calculator.service';
import { RegistrationConfirmedEvent } from '../../events/registration-confirmed.event';

// Código de error de Postgres para "unique_violation"
const POSTGRES_UNIQUE_VIOLATION = '23505';

@CommandHandler(CreateRegistrationCommand)
export class CreateRegistrationHandler
  implements ICommandHandler<CreateRegistrationCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly discountCalculator: DiscountCalculatorService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateRegistrationCommand): Promise<Registration> {
    const email = command.email.trim().toLowerCase();

    const eventDate = new Date(command.eventDateTime);
    if (eventDate <= new Date()) {
      throw new BadRequestException(
        'La fecha y hora del evento debe ser una fecha futura',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Defensa adicional: la garantía real contra concurrencia es el constraint único en DB.
        const existingRegistration = await manager.findOne(Registration, {
          where: { email },
        });

        if (existingRegistration) {
          throw new ConflictException(
            `Ya existe una confirmación de asistencia para el email ${email}`,
          );
        }

        const items = await manager.find(Item, {
          where: command.selectedItemIds.map((id) => ({ id, active: true })),
        });

        if (items.length !== command.selectedItemIds.length) {
          throw new NotFoundException(
            'Uno o más ítems seleccionados no existen o no están activos',
          );
        }

        const selectedItems = items.map((item) => ({
          id: item.id,
          type:
            item.type === 'SERVICE' ? ('SERVICE' as const) : ('PRODUCT' as const),
          price: Number(item.price),
        }));

        const discounts =
          this.discountCalculator.calculateDiscounts(selectedItems);

        const registration = manager.create(Registration, {
          firstName: command.firstName,
          lastName: command.lastName,
          email,
          eventDateTime: eventDate,
          servicesDiscountPct: discounts.servicesDiscountPct,
          productsDiscountPct: discounts.productsDiscountPct,
        });

        const savedRegistration = await manager.save(Registration, registration);

        const registrationItems = items.map((item) =>
          manager.create(RegistrationItem, {
            registrationId: savedRegistration.id,
            itemId: item.id,
            itemType: item.type,
            priceSnapshot: item.price,
          }),
        );

        savedRegistration.items = await manager.save(
          RegistrationItem,
          registrationItems,
        );

        return savedRegistration;
      }).then((savedRegistration) => {
        this.eventBus.publish(
          new RegistrationConfirmedEvent(
            savedRegistration.id,
            savedRegistration.email,
            savedRegistration.servicesDiscountPct,
            savedRegistration.productsDiscountPct,
          ),
        );

        return savedRegistration;
      });
    } catch (error) {
      // Red de seguridad si dos requests concurrentes pasan ambas el check de arriba.
      if (
        error instanceof QueryFailedError &&
        (error as any).code === POSTGRES_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `Ya existe una confirmación de asistencia para el email ${email}`,
        );
      }
      throw error;
    }
  }
}
