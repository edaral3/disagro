import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetRegistrationByIdQuery } from '../impl/get-registration-by-id.query';
import { Registration } from '../../entities/registration.entity';

@QueryHandler(GetRegistrationByIdQuery)
export class GetRegistrationByIdHandler
  implements IQueryHandler<GetRegistrationByIdQuery>
{
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
  ) {}

  async execute(query: GetRegistrationByIdQuery): Promise<Registration> {
    const registration = await this.registrationRepository.findOne({
      where: { id: query.id },
      relations: ['items'],
    });

    if (!registration) {
      throw new NotFoundException(
        `No se encontró registración con ID ${query.id}`,
      );
    }

    return registration;
  }
}
