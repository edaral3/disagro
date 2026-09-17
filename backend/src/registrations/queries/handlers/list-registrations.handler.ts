import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ListRegistrationsQuery } from '../impl/list-registrations.query';
import { Registration } from '../../entities/registration.entity';

@QueryHandler(ListRegistrationsQuery)
export class ListRegistrationsHandler implements IQueryHandler<ListRegistrationsQuery> {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
  ) {}

  async execute(query: ListRegistrationsQuery): Promise<Registration[]> {
    let queryBuilder = this.registrationRepository
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.items', 'items');

    if (query.search) {
      queryBuilder = queryBuilder.andWhere(
        '(registration.firstName ILIKE :search OR registration.lastName ILIKE :search OR registration.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.sortBy === 'createdAt_asc') {
      queryBuilder = queryBuilder.orderBy('registration.createdAt', 'ASC');
    } else {
      queryBuilder = queryBuilder.orderBy('registration.createdAt', 'DESC');
    }

    return queryBuilder.getMany();
  }
}
