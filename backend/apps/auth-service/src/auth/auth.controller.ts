import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_PATTERNS } from '@app/common';
import { AuthService } from './auth.service';
import type { LoginData } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import type {
  BuscarUsuariosFiltro,
  CrearUsuarioData,
} from '../usuarios/usuarios.service';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @MessagePattern(AUTH_PATTERNS.REGISTRAR)
  registrar(@Payload() data: CrearUsuarioData) {
    return this.authService.registrar(data);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  login(@Payload() data: LoginData) {
    return this.authService.login(data);
  }

  @MessagePattern(AUTH_PATTERNS.PERFIL)
  perfil(@Payload() data: { id: string }) {
    return this.usuariosService.obtener(data.id);
  }

  @MessagePattern(AUTH_PATTERNS.BUSCAR_USUARIOS)
  buscar(@Payload() filtro: BuscarUsuariosFiltro) {
    return this.usuariosService.buscar(filtro);
  }
}
