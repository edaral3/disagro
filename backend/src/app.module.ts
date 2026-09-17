import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ItemsModule } from './items/items.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get('DB_SYNCHRONIZE', 'false') === 'true' ||
          configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          // ConfigService.get() siempre devuelve string (viene de env vars).
          // jsonwebtoken interpreta expiresIn como NÚMERO=segundos, pero
          // como STRING lo parsea con la librería `ms`, que trata un
          // numeral sin unidad (ej. "180") como MILISEGUNDOS (0.18s,
          // redondeado a 0) — el token nunca expiraba de verdad. Number()
          // fuerza la interpretación correcta (segundos).
          expiresIn: Number(configService.get('JWT_EXPIRATION', 1800)),
        },
      }),
      global: true,
    }),
    CqrsModule,
    ItemsModule,
    RegistrationsModule,
    SessionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
