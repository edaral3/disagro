import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Guard que valida un JWT anónimo de sesión.
 * Este JWT se emite sin login de usuario (solo para el flujo del formulario).
 * Usado para proteger POST /registrations contra spam/CSRF.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de sesión no encontrado. Inicia una sesión en POST /session/start',
      );
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // Attach payload to request for future use
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token de sesión inválido o expirado');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
