import { IQuery } from '@nestjs/cqrs';

export class GetRegistrationByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
