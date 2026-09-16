import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateRegistrationCommand } from './commands/impl/create-registration.command';
import { GetRegistrationByIdQuery } from './queries/impl/get-registration-by-id.query';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { SessionGuard } from '../session/guards/session.guard';
import { Registration } from './entities/registration.entity';

@Controller('registrations')
@ApiTags('Registrations')
export class RegistrationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(201)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Confirmar asistencia y seleccionar servicios/productos',
    description:
      'Crea un registro de confirmación. Calcula automáticamente descuentos según cantidad y precios seleccionados. Requiere un token JWT válido de sesión.',
  })
  @ApiResponse({
    status: 201,
    description: 'Confirmación creada exitosamente',
    type: RegistrationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o fecha no es futura',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una confirmación para este email',
  })
  async create(
    @Body() dto: CreateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.commandBus.execute(
      new CreateRegistrationCommand(
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.eventDateTime,
        dto.selectedItemIds,
      ),
    );

    return this.mapToResponse(registration);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalles de una confirmación',
    description: 'Retorna los detalles de una confirmación incluyendo descuentos calculados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la confirmación',
    type: RegistrationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Confirmación no encontrada',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.queryBus.execute(
      new GetRegistrationByIdQuery(id),
    );

    return this.mapToResponse(registration);
  }

  private mapToResponse(registration: Registration): RegistrationResponseDto {
    return {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      eventDateTime: registration.eventDateTime,
      servicesDiscountPct: registration.servicesDiscountPct,
      productsDiscountPct: registration.productsDiscountPct,
      items: registration.items?.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        itemType: item.itemType,
        priceSnapshot: Number(item.priceSnapshot),
      })) || [],
      createdAt: registration.createdAt,
    };
  }
}
