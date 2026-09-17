import { Controller, Post, HttpCode } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StartSessionResponseDto } from './dto/session.dto';

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
    // No seteamos `iat` manualmente: jsonwebtoken lo autogenera en segundos
    // y lo combina con signOptions.expiresIn para calcular `exp`.
    const payload = {
      sub: 'anonymous-form',
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      // Debe coincidir con signOptions.expiresIn en AppModule (JwtModule).
      expiresIn: Number(this.configService.get('JWT_EXPIRATION', 1800)),
    };
  }
}
