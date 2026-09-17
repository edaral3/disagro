import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Registration } from './entities/registration.entity';
import { RegistrationItem } from './entities/registration-item.entity';
import { RegistrationsController } from './registrations.controller';
import { CreateRegistrationHandler } from './commands/handlers/create-registration.handler';
import { GetRegistrationByIdHandler } from './queries/handlers/get-registration-by-id.handler';
import { ListRegistrationsHandler } from './queries/handlers/list-registrations.handler';
import { DiscountCalculatorService } from '../common/services/discount-calculator.service';
import { SessionModule } from '../session/session.module';

const CommandHandlers = [CreateRegistrationHandler];
const QueryHandlers = [GetRegistrationByIdHandler, ListRegistrationsHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, RegistrationItem]),
    CqrsModule,
    SessionModule, // Required: SessionGuard (used via @UseGuards) is provided here
  ],
  controllers: [RegistrationsController],
  providers: [...CommandHandlers, ...QueryHandlers, DiscountCalculatorService],
  exports: [TypeOrmModule],
})
export class RegistrationsModule {}
