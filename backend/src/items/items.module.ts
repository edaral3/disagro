import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Item } from './entities/item.entity';
import { ItemsController } from './items.controller';
import { GetItemsHandler } from './queries/handlers/get-items.handler';

const QueryHandlers = [GetItemsHandler];

@Module({
  imports: [TypeOrmModule.forFeature([Item]), CqrsModule],
  controllers: [ItemsController],
  providers: [...QueryHandlers],
  exports: [TypeOrmModule],
})
export class ItemsModule {}
