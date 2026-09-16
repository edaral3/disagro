import { Controller, Post, HttpCode } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
  constructor(private readonly jwtService: JwtService) {}

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
    // Payload anónimo: solo incluimos un ID de sesión único
    const payload = {
      sub: 'anonymous-form',
      iat: Date.now(),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      expiresIn: 1800, // 30 minutos
    };
  }
}
