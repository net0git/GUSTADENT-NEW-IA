import { AppError } from '../../../shared/errors/app-error';
import {
  conFormato,
  objetoDeCuerpo,
  passwordNueva,
  textoOpcional,
  textoRequerido,
} from '../../../shared/validation/validadores';
import { Perfil } from '../../auth/domain/usuario-autenticable';
import { CrearUsuarioInput } from '../application/use-cases/usuarios.use-cases';
import { DatosUsuario, FiltrosUsuario, PERFILES } from '../domain/usuario';

const USERNAME_VALIDO = /^[A-Za-z0-9._-]+$/;

function perfilValido(valor: unknown): Perfil {
  if (typeof valor !== 'string' || !PERFILES.includes(valor as Perfil)) {
    throw new AppError(400, 'VALIDACION', `El perfil debe ser uno de: ${PERFILES.join(', ')}`);
  }
  return valor as Perfil;
}

function listaDeSucursales(valor: unknown): number[] {
  if (!Array.isArray(valor)) {
    throw new AppError(400, 'VALIDACION', 'El campo sucursales debe ser una lista de identificadores');
  }

  const identificadores = valor.map((elemento) => {
    if (typeof elemento !== 'number' || !Number.isInteger(elemento) || elemento <= 0) {
      throw new AppError(400, 'VALIDACION', 'Cada sucursal debe ser un identificador válido');
    }
    return elemento;
  });

  return [...new Set(identificadores)];
}

export function validarIdentificador(valor: string): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(400, 'VALIDACION', 'El identificador no es válido');
  }
  return numero;
}

export function validarFiltros(consulta: Record<string, unknown>): FiltrosUsuario {
  const filtros: FiltrosUsuario = {};

  if (consulta.perfil !== undefined) {
    filtros.perfil = perfilValido(consulta.perfil);
  }
  if (consulta.activo !== undefined) {
    if (consulta.activo !== 'true' && consulta.activo !== 'false') {
      throw new AppError(400, 'VALIDACION', 'El filtro activo debe ser true o false');
    }
    filtros.activo = consulta.activo === 'true';
  }

  return filtros;
}

export function validarDatosUsuario(cuerpo: unknown): DatosUsuario {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    dni: conFormato(textoRequerido(datos.dni, 'dni', 8), /^\d{8}$/, 'dni', 'debe tener 8 dígitos'),
    nombreCompleto: textoRequerido(datos.nombreCompleto, 'nombreCompleto', 80),
    especialidad: textoOpcional(datos.especialidad, 'especialidad', 25),
    telefono: textoOpcional(datos.telefono, 'telefono', 16),
    username: conFormato(
      textoRequerido(datos.username, 'username', 20),
      USERNAME_VALIDO,
      'username',
      'solo puede contener letras, números, punto, guion y guion bajo'
    ),
    perfil: perfilValido(datos.perfil),
  };
}

export function validarNuevoUsuario(cuerpo: unknown): CrearUsuarioInput {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    ...validarDatosUsuario(cuerpo),
    password: passwordNueva(datos.password, 'password'),
    sucursales: listaDeSucursales(datos.sucursales),
  };
}

export function validarEstado(cuerpo: unknown): boolean {
  const datos = objetoDeCuerpo(cuerpo);
  if (typeof datos.activo !== 'boolean') {
    throw new AppError(400, 'VALIDACION', 'El campo activo debe ser verdadero o falso');
  }
  return datos.activo;
}

export function validarSucursalesAsignadas(cuerpo: unknown): number[] {
  return listaDeSucursales(objetoDeCuerpo(cuerpo).sucursales);
}
