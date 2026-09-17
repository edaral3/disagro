import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionGuard } from './guards/session.guard';

// JwtService está disponible sin re-importar JwtModule: se registra como global en AppModule.
@Module({
  controllers: [SessionController],
  providers: [SessionGuard],
  exports: [SessionGuard],
})
export class SessionModule {}
