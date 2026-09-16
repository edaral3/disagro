import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetItemsQuery } from './queries/impl/get-items.query';
import { GetItemsDto, ItemResponseDto } from './dto/get-items.dto';
import { Item } from './entities/item.entity';

@Controller('items')
@ApiTags('Items')
export class ItemsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener servicios y productos',
    description:
      'Retorna lista de servicios y/o productos según filtros. Se pueden filtrar por tipo (SERVICE/PRODUCT), texto, rango de precio, y ordenar por precio.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ítems',
    type: [ItemResponseDto],
  })
  async getItems(@Query() filters: GetItemsDto): Promise<Item[]> {
    return this.queryBus.execute(
      new GetItemsQuery(
        filters.search,
        filters.type,
        filters.minPrice,
        filters.maxPrice,
        filters.sortBy,
      ),
    );
  }
}
