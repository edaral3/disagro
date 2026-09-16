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

    // Validar que eventDateTime es una fecha futura
    const eventDate = new Date(command.eventDateTime);
    if (eventDate <= new Date()) {
      throw new BadRequestException(
        'La fecha y hora del evento debe ser una fecha futura',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Validar que no existe otra confirmación del mismo email
        // (defensa adicional; el constraint único de DB es la garantía real
        // contra condiciones de carrera bajo requests concurrentes)
        const existingRegistration = await manager.findOne(Registration, {
          where: { email },
        });

        if (existingRegistration) {
          throw new ConflictException(
            `Ya existe una confirmación de asistencia para el email ${email}`,
          );
        }

        // Recuperar los ítems activos del DB (deduplicados por el DTO con @ArrayUnique)
        const items = await manager.find(Item, {
          where: command.selectedItemIds.map((id) => ({ id, active: true })),
        });

        if (items.length !== command.selectedItemIds.length) {
          throw new NotFoundException(
            'Uno o más ítems seleccionados no existen o no están activos',
          );
        }

        // Calcular descuentos usando el servicio de dominio puro
        const selectedItems = items.map((item) => ({
          id: item.id,
          type:
            item.type === 'SERVICE' ? ('SERVICE' as const) : ('PRODUCT' as const),
          price: Number(item.price),
        }));

        const discounts =
          this.discountCalculator.calculateDiscounts(selectedItems);

        // Crear la Registration
        const registration = manager.create(Registration, {
          firstName: command.firstName,
          lastName: command.lastName,
          email,
          eventDateTime: eventDate,
          servicesDiscountPct: discounts.servicesDiscountPct,
          productsDiscountPct: discounts.productsDiscountPct,
        });

        const savedRegistration = await manager.save(Registration, registration);

        // Crear los RegistrationItems con snapshot de precios
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
        // Emitir evento de dominio (fuera de la transacción, ya confirmada)
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
      // Red de seguridad: si dos requests concurrentes con el mismo email
      // pasan ambas el check anterior antes de que la primera haga commit,
      // el constraint único de la DB rechaza el segundo INSERT.
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
