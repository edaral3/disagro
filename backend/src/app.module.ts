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
        // No hay migraciones todavía (ver CLAUDE.md): DB_SYNCHRONIZE permite
        // habilitar sync explícitamente fuera de dev (ej. primer deploy a la
        // nube) sin acoplarlo a NODE_ENV. Default 'false' preserva el
        // comportamiento actual de dev/Docker.
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
          expiresIn: configService.get('JWT_EXPIRATION', 1800),
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
