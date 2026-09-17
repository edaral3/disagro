import { IQuery } from '@nestjs/cqrs';

export type RegistrationsSortOption = 'createdAt_asc' | 'createdAt_desc';

export class ListRegistrationsQuery implements IQuery {
  constructor(
    public readonly search?: string,
    public readonly sortBy?: RegistrationsSortOption,
  ) {}
}
