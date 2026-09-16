import { ApiProperty } from '@nestjs/swagger';

export class StartSessionResponseDto {
  @ApiProperty({
    description: 'JWT token para usar en Authorization header (Bearer token)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Tiempo de expiración del token en segundos',
    example: 1800,
  })
  expiresIn: number;
}
