import { pool } from '../../../database/pool';
import { Perfil, UsuarioAutenticable } from '../domain/usuario-autenticable';
import { UsuarioAuthRepository } from '../application/ports/usuario-auth.repository';

interface UsuarioFila {
  id_usuario: number;
  username: string;
  nombre_completo: string;
  perfil: Perfil;
  activo: boolean;
  password_hash: string;
  token_version: number;
}

const COLUMNAS = `
  id_usuario, username, nombre_completo, perfil, activo, password_hash, token_version
`;

function aDominio(fila: UsuarioFila): UsuarioAutenticable {
  return {
    id: fila.id_usuario,
    username: fila.username,
    nombreCompleto: fila.nombre_completo,
    perfil: fila.perfil,
    activo: fila.activo,
    passwordHash: fila.password_hash,
    tokenVersion: fila.token_version,
  };
}

export class PgUsuarioAuthRepository implements UsuarioAuthRepository {
  async buscarPorUsername(username: string): Promise<UsuarioAutenticable | null> {
    const resultado = await pool.query<UsuarioFila>(
      `SELECT ${COLUMNAS} FROM usuarios WHERE username = $1`,
      [username]
    );
    const fila = resultado.rows[0];
    return fila ? aDominio(fila) : null;
  }

  async buscarPorId(id: number): Promise<UsuarioAutenticable | null> {
    const resultado = await pool.query<UsuarioFila>(
      `SELECT ${COLUMNAS} FROM usuarios WHERE id_usuario = $1`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? aDominio(fila) : null;
  }

  async actualizarPasswordHash(id: number, passwordHash: string): Promise<void> {
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2', [
      passwordHash,
      id,
    ]);
  }

  async incrementarTokenVersion(id: number): Promise<void> {
    await pool.query('UPDATE usuarios SET token_version = token_version + 1 WHERE id_usuario = $1', [
      id,
    ]);
  }
}
