import {
  objetoDeCuerpo,
  passwordNueva,
  secretoRequerido,
  textoRequerido,
} from '../../../shared/validation/validadores';

export interface LoginBody {
  username: string;
  password: string;
}

export function validarLogin(cuerpo: unknown): LoginBody {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    username: textoRequerido(datos.username, 'username', 20),
    password: secretoRequerido(datos.password, 'password'),
  };
}

export interface CambiarPasswordBody {
  passwordActual: string;
  passwordNueva: string;
}

export function validarCambioPassword(cuerpo: unknown): CambiarPasswordBody {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    passwordActual: secretoRequerido(datos.passwordActual, 'passwordActual'),
    passwordNueva: passwordNueva(datos.passwordNueva, 'passwordNueva'),
  };
}
