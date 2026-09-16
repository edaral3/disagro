import { Controller, Post, HttpCode } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StartSessionResponseDto } from './dto/session.dto';

/**
 * Controlador de sesiones anónimas.
 * El frontend llama a POST /session/start antes de rellenar el formulario de confirmación.
 * Recibe un JWT de corta duración que debe incluir en el Authorization header
 * cuando POST /registrations.
 */
@Controller('session')
@ApiTags('Session')
export class SessionController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('start')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar una sesión anónima',
    description:
      'Emite un JWT anónimo de corta duración para proteger el flujo del formulario. No requiere login de usuario. El token debe incluirse en el Authorization header (Bearer) para POST /registrations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión iniciada exitosamente',
    type: StartSessionResponseDto,
  })
  startSession(): StartSessionResponseDto {
    // Payload anónimo. No seteamos `iat` manualmente: jsonwebtoken lo
    // autogenera en segundos (correcto según el spec de JWT) y lo combina
    // con signOptions.expiresIn para calcular `exp`. La versión anterior
    // pasaba `Date.now()` (milisegundos) como `iat`, lo que corrompía
    // `exp` a una fecha ~58,000 años en el futuro — el token JAMÁS
    // expiraba de verdad, sin importar JWT_EXPIRATION.
    const payload = {
      sub: 'anonymous-form',
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      // Misma fuente que signOptions.expiresIn en AppModule (JwtModule) —
      // antes estaba hardcodeado en 1800 y podía desincronizarse del JWT
      // real si JWT_EXPIRATION cambiaba.
      expiresIn: Number(this.configService.get('JWT_EXPIRATION', 1800)),
    };
  }
}
