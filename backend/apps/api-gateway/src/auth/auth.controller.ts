import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AUTH_PATTERNS } from '@app/common';
import type { UsuarioActual as UsuarioActualData } from '@app/common';
import { AuthClient } from '../common/microservicios';
import { Public, UsuarioActual } from '../common/decorators';
import { LoginDto, RegistroDto } from './auth.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthClient) {}

  @Public()
  @Post('registro')
  @ApiOperation({ summary: 'Registrar un paciente o enfermero' })
  @ApiConflictResponse({ description: 'Email o DNI ya registrado' })
  registrar(@Body() dto: RegistroDto) {
    return this.auth.send(AUTH_PATTERNS.REGISTRAR, dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  // Límite más estricto para dificultar ataques de fuerza bruta.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión y obtener el token JWT' })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas' })
  login(@Body() dto: LoginDto) {
    return this.auth.send(AUTH_PATTERNS.LOGIN, dto);
  }

  @Get('perfil')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario logueado' })
  perfil(@UsuarioActual() usuario: UsuarioActualData) {
    return this.auth.send(AUTH_PATTERNS.PERFIL, { id: usuario.id });
  }
}
