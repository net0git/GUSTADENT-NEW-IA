import { AppError } from '../../../../shared/errors/app-error';
import { UsuarioSesion } from '../../domain/usuario-autenticable';
import { TokenService } from '../ports/token-service.port';
import { UsuarioAuthRepository } from '../ports/usuario-auth.repository';

const SESION_INVALIDA = new AppError(401, 'SESION_INVALIDA', 'La sesión no es válida o expiró');

export class VerificarSesionUseCase {
  constructor(
    private readonly usuarios: UsuarioAuthRepository,
    private readonly tokens: TokenService
  ) {}

  async execute(token: string): Promise<UsuarioSesion> {
    let payload;
    try {
      payload = this.tokens.verificar(token);
    } catch {
      throw SESION_INVALIDA;
    }

    const usuario = await this.usuarios.buscarPorId(payload.sub);

    if (!usuario || !usuario.activo || usuario.tokenVersion !== payload.version) {
      throw SESION_INVALIDA;
    }

    return {
      id: usuario.id,
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      perfil: usuario.perfil,
    };
  }
}
