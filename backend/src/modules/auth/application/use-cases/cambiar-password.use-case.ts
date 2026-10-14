import { AppError } from '../../../../shared/errors/app-error';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UsuarioAuthRepository } from '../ports/usuario-auth.repository';

export interface CambiarPasswordInput {
  idUsuario: number;
  passwordActual: string;
  passwordNueva: string;
}

export class CambiarPasswordUseCase {
  constructor(
    private readonly usuarios: UsuarioAuthRepository,
    private readonly hasher: PasswordHasher
  ) {}

  async execute(entrada: CambiarPasswordInput): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(entrada.idUsuario);

    if (!usuario) {
      throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'El usuario no existe');
    }

    const passwordCorrecta = await this.hasher.comparar(entrada.passwordActual, usuario.passwordHash);
    if (!passwordCorrecta) {
      throw new AppError(400, 'PASSWORD_ACTUAL_INCORRECTA', 'La contraseña actual no es correcta');
    }

    const nuevoHash = await this.hasher.generar(entrada.passwordNueva);
    await this.usuarios.actualizarPasswordHash(entrada.idUsuario, nuevoHash);
    await this.usuarios.incrementarTokenVersion(entrada.idUsuario);
  }
}
