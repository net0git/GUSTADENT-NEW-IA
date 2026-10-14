import { AppError } from '../../../../shared/errors/app-error';
import { UsuarioSesion } from '../../domain/usuario-autenticable';
import { PasswordHasher } from '../ports/password-hasher.port';
import { TokenService } from '../ports/token-service.port';
import { UsuarioAuthRepository } from '../ports/usuario-auth.repository';

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  usuario: UsuarioSesion;
}

export class LoginUseCase {
  constructor(
    private readonly usuarios: UsuarioAuthRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService
  ) {}

  async execute(entrada: LoginInput): Promise<LoginOutput> {
    const usuario = await this.usuarios.buscarPorUsername(entrada.username);
    const credencialesValidas =
      usuario !== null &&
      usuario.activo &&
      (await this.hasher.comparar(entrada.password, usuario.passwordHash));

    if (!usuario || !credencialesValidas) {
      throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos');
    }

    const token = this.tokens.generar({
      sub: usuario.id,
      perfil: usuario.perfil,
      version: usuario.tokenVersion,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombreCompleto: usuario.nombreCompleto,
        perfil: usuario.perfil,
      },
    };
  }
}
