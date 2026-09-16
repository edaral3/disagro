import { IEvent } from '@nestjs/cqrs';

export class RegistrationConfirmedEvent implements IEvent {
  constructor(
    public readonly registrationId: string,
    public readonly email: string,
    public readonly servicesDiscountPct: number,
    public readonly productsDiscountPct: number,
  ) {}
}
