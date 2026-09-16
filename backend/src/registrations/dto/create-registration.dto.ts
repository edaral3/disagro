import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsISO8601,
  ArrayMinSize,
  ArrayUnique,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({
    description: 'Primer nombre del cliente',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Apellido del cliente',
    example: 'Pérez',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Fecha y hora del evento (ISO 8601, debe ser una fecha futura)',
    example: '2024-12-15T18:30:00Z',
  })
  @IsISO8601()
  eventDateTime: string;

  @ApiProperty({
    description: 'Array de IDs (UUID) de servicios y/o productos seleccionados',
    type: [String],
    minItems: 1,
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, {
    message: 'Debe seleccionar al menos 1 servicio o producto',
  })
  @ArrayUnique({ message: 'No se puede seleccionar el mismo ítem más de una vez' })
  selectedItemIds: string[];
}
