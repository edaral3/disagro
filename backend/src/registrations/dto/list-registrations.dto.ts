import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { RegistrationsSortOption } from '../queries/impl/list-registrations.query';

const SORT_OPTIONS: RegistrationsSortOption[] = [
  'createdAt_asc',
  'createdAt_desc',
];

export class ListRegistrationsDto {
  @ApiPropertyOptional({
    description: 'Búsqueda de texto (nombre, apellido o email)',
    example: 'juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Orden por fecha de confirmación. Si se omite, se ordena por más reciente primero.',
    enum: SORT_OPTIONS,
    example: 'createdAt_desc',
  })
  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sortBy?: RegistrationsSortOption;
}
