import {
  conFormato,
  objetoDeCuerpo,
  passwordNueva,
  textoOpcional,
  textoRequerido,
} from '../../../shared/validation/validadores';
import { AdministradorSetupInput } from '../application/use-cases/configuracion-inicial.use-cases';
import { EmpresaSetup, SucursalSetup } from '../application/ports/setup.repository';

const USERNAME_VALIDO = /^[A-Za-z0-9._-]+$/;

export function validarEmpresa(cuerpo: unknown): EmpresaSetup {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    nombreEmpresa: textoRequerido(datos.nombreEmpresa, 'nombreEmpresa', 50),
    ruc: conFormato(textoRequerido(datos.ruc, 'ruc', 11), /^\d{11}$/, 'ruc', 'debe tener 11 dígitos'),
    direccion: textoOpcional(datos.direccion, 'direccion', 80),
    telefono: textoOpcional(datos.telefono, 'telefono', 16),
  };
}

export function validarSucursal(cuerpo: unknown): SucursalSetup {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    nombre: textoRequerido(datos.nombre, 'nombre', 20),
    direccion: textoOpcional(datos.direccion, 'direccion', 80),
  };
}

export function validarAdministrador(cuerpo: unknown): AdministradorSetupInput {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    username: conFormato(
      textoRequerido(datos.username, 'username', 20),
      USERNAME_VALIDO,
      'username',
      'solo puede contener letras, números, punto, guion y guion bajo'
    ),
    password: passwordNueva(datos.password, 'password'),
    dni: conFormato(textoRequerido(datos.dni, 'dni', 8), /^\d{8}$/, 'dni', 'debe tener 8 dígitos'),
    nombreCompleto: textoRequerido(datos.nombreCompleto, 'nombreCompleto', 80),
  };
}
