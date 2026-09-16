import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetItemsQuery } from '../impl/get-items.query';
import { Item } from '../../entities/item.entity';

@QueryHandler(GetItemsQuery)
export class GetItemsHandler implements IQueryHandler<GetItemsQuery> {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async execute(query: GetItemsQuery): Promise<Item[]> {
    let queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .where('item.active = :active', { active: true });

    if (query.type) {
      queryBuilder = queryBuilder.andWhere('item.type = :type', {
        type: query.type,
      });
    }

    if (query.search) {
      queryBuilder = queryBuilder.andWhere(
        '(item.name ILIKE :search OR item.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.minPrice !== undefined) {
      queryBuilder = queryBuilder.andWhere('item.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      queryBuilder = queryBuilder.andWhere('item.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    if (query.sortBy === 'price_asc') {
      queryBuilder = queryBuilder.orderBy('item.price', 'ASC');
    } else if (query.sortBy === 'price_desc') {
      queryBuilder = queryBuilder.orderBy('item.price', 'DESC');
    } else {
      queryBuilder = queryBuilder.orderBy('item.name', 'ASC');
    }

    return queryBuilder.getMany();
  }
}
