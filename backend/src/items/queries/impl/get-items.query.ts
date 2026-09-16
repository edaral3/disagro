import { IQuery } from '@nestjs/cqrs';
import { ItemType } from '../../entities/item.entity';

export type ItemsSortOption = 'price_asc' | 'price_desc';

export class GetItemsQuery implements IQuery {
  constructor(
    public readonly search?: string,
    public readonly type?: ItemType,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly sortBy?: ItemsSortOption,
  ) {}
}
