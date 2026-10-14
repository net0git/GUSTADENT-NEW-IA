import { UsuarioAutenticable } from '../../domain/usuario-autenticable';

export interface UsuarioAuthRepository {
  buscarPorUsername(username: string): Promise<UsuarioAutenticable | null>;
  buscarPorId(id: number): Promise<UsuarioAutenticable | null>;
  actualizarPasswordHash(id: number, passwordHash: string): Promise<void>;
  incrementarTokenVersion(id: number): Promise<void>;
}
