import { UsuarioAuthRepository } from '../ports/usuario-auth.repository';

export class LogoutUseCase {
  constructor(private readonly usuarios: UsuarioAuthRepository) {}

  async execute(idUsuario: number): Promise<void> {
    await this.usuarios.incrementarTokenVersion(idUsuario);
  }
}
