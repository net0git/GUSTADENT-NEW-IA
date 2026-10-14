import { AppError } from '../../../../shared/errors/app-error';
import { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';
import { DatosUsuario, FiltrosUsuario, Usuario } from '../../domain/usuario';
import { generarPasswordTemporal } from '../../domain/password-temporal';
import { OdontologoDisponible, UsuariosRepository } from '../ports/usuarios.repository';

export interface CrearUsuarioInput extends DatosUsuario {
  password: string;
  sucursales: number[];
}

const USUARIO_NO_ENCONTRADO = 'USUARIO_NO_ENCONTRADO';
const OPERACION_NO_PERMITIDA = 'OPERACION_NO_PERMITIDA';

async function obtenerExistente(repositorio: UsuariosRepository, id: number): Promise<Usuario> {
  const usuario = await repositorio.obtenerPorId(id);
  if (!usuario) {
    throw new AppError(404, USUARIO_NO_ENCONTRADO, 'El usuario no existe');
  }
  return usuario;
}

export class ListarUsuariosUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  execute(filtros: FiltrosUsuario): Promise<Usuario[]> {
    return this.usuarios.listar(filtros);
  }
}

/**
 * Listado minimo de profesionales, disponible para cualquier perfil autenticado,
 * porque las atenciones necesitan elegir al odontologo responsable.
 */
export class ListarOdontologosUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  execute(): Promise<OdontologoDisponible[]> {
    return this.usuarios.listarOdontologosActivos();
  }
}

export class ObtenerUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  execute(id: number): Promise<Usuario> {
    return obtenerExistente(this.usuarios, id);
  }
}

export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly hasher: PasswordHasher
  ) {}

  async execute(entrada: CrearUsuarioInput): Promise<Usuario> {
    const id = await this.usuarios.crear({
      dni: entrada.dni,
      nombreCompleto: entrada.nombreCompleto,
      especialidad: entrada.especialidad,
      telefono: entrada.telefono,
      username: entrada.username,
      perfil: entrada.perfil,
      passwordHash: await this.hasher.generar(entrada.password),
      sucursales: entrada.sucursales,
    });
    return obtenerExistente(this.usuarios, id);
  }
}

export class ActualizarUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async execute(idActor: number, id: number, datos: DatosUsuario): Promise<Usuario> {
    await obtenerExistente(this.usuarios, id);

    if (idActor === id && datos.perfil !== 'administrador') {
      throw new AppError(400, OPERACION_NO_PERMITIDA, 'No puedes quitarte tu propio perfil de administrador');
    }

    await this.usuarios.actualizar(id, datos);
    return obtenerExistente(this.usuarios, id);
  }
}

export class CambiarEstadoUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async execute(idActor: number, id: number, activo: boolean): Promise<Usuario> {
    await obtenerExistente(this.usuarios, id);

    if (idActor === id && !activo) {
      throw new AppError(400, OPERACION_NO_PERMITIDA, 'No puedes desactivar tu propia cuenta');
    }

    await this.usuarios.cambiarEstado(id, activo);
    return obtenerExistente(this.usuarios, id);
  }
}

export class ResetearPasswordUseCase {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly hasher: PasswordHasher
  ) {}

  /**
   * Genera una contrasena temporal y cierra las sesiones activas del usuario.
   * La contrasena temporal se devuelve una sola vez para que el administrador
   * pueda comunicarla; en la base solo queda el hash.
   */
  async execute(id: number): Promise<{ passwordTemporal: string; username: string }> {
    const usuario = await obtenerExistente(this.usuarios, id);
    const passwordTemporal = generarPasswordTemporal();

    await this.usuarios.actualizarPasswordHash(id, await this.hasher.generar(passwordTemporal));
    await this.usuarios.incrementarTokenVersion(id);

    return { passwordTemporal, username: usuario.username };
  }
}

export class AsignarSucursalesUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async execute(id: number, sucursales: number[]): Promise<Usuario> {
    await obtenerExistente(this.usuarios, id);
    await this.usuarios.reemplazarSucursales(id, sucursales);
    return obtenerExistente(this.usuarios, id);
  }
}
