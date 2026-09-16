import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionGuard } from './guards/session.guard';

// Nota: JwtModule ya se registra como global en AppModule (JwtModule.registerAsync({..., global: true})),
// por lo que JwtService está disponible aquí (y en cualquier módulo) sin necesidad de re-importarlo.
@Module({
  controllers: [SessionController],
  providers: [SessionGuard],
  exports: [SessionGuard],
})
export class SessionModule {}
