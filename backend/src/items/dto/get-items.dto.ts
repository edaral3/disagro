import { IsOptional, IsString, IsEnum, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemType } from '../entities/item.entity';
import type { ItemsSortOption } from '../queries/impl/get-items.query';
import { ApiPropertyOptional } from '@nestjs/swagger';

const SORT_OPTIONS: ItemsSortOption[] = ['price_asc', 'price_desc'];

export class GetItemsDto {
  @ApiPropertyOptional({
    description: 'Búsqueda de texto (nombre o descripción)',
    example: 'internet',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtro por tipo de ítem',
    enum: ItemType,
    example: ItemType.SERVICE,
  })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @ApiPropertyOptional({
    description: 'Precio mínimo (inclusive)',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Precio máximo (inclusive)',
    example: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Orden por precio. Si se omite, se ordena por nombre ascendente.',
    enum: SORT_OPTIONS,
    example: 'price_asc',
  })
  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sortBy?: ItemsSortOption;
}

export class ItemResponseDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: ItemType;
  category?: string;
}
