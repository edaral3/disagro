import { ICommand } from '@nestjs/cqrs';

export class CreateRegistrationCommand implements ICommand {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly eventDateTime: string,
    public readonly selectedItemIds: string[],
  ) {}
}
