import { AppError } from '../../../shared/errors/app-error';
import {
  conFormato,
  objetoDeCuerpo,
  textoOpcional,
  textoRequerido,
} from '../../../shared/validation/validadores';
import { DatosPaciente, Sexo } from '../domain/paciente';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ANIO_MINIMO = 1900;

function fechaNacimiento(opcional: string | null): string | null {
  if (opcional === null) {
    return null;
  }
  if (!FORMATO_FECHA.test(opcional)) {
    throw new AppError(400, 'VALIDACION', 'El campo fechaNacimiento debe tener el formato AAAA-MM-DD');
  }

  const fecha = new Date(`${opcional}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    throw new AppError(400, 'VALIDACION', 'El campo fechaNacimiento no es una fecha válida');
  }

  const hoy = new Date();
  const hoyMedianoche = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  if (fecha > hoyMedianoche) {
    throw new AppError(400, 'VALIDACION', 'La fecha de nacimiento no puede ser futura');
  }
  if (fecha.getFullYear() < ANIO_MINIMO) {
    throw new AppError(400, 'VALIDACION', `La fecha de nacimiento no puede ser anterior a ${ANIO_MINIMO}`);
  }

  return opcional;
}

function sexo(valor: string | null): Sexo | null {
  if (valor === null) {
    return null;
  }
  if (valor !== 'M' && valor !== 'F') {
    throw new AppError(400, 'VALIDACION', 'El campo sexo debe ser M o F');
  }
  return valor;
}

function procedencia(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    throw new AppError(400, 'VALIDACION', 'El campo idProcedencia no es válido');
  }
  return valor;
}

export function validarDatosPaciente(cuerpo: unknown): DatosPaciente {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    dni: conFormato(textoRequerido(datos.dni, 'dni', 8), /^\d{8}$/, 'dni', 'debe tener 8 dígitos'),
    nombres: textoRequerido(datos.nombres, 'nombres', 40),
    apPaterno: textoRequerido(datos.apPaterno, 'apPaterno', 20),
    apMaterno: textoOpcional(datos.apMaterno, 'apMaterno', 20),
    fechaNacimiento: fechaNacimiento(textoOpcional(datos.fechaNacimiento, 'fechaNacimiento', 10)),
    sexo: sexo(textoOpcional(datos.sexo, 'sexo', 1)),
    telefono: textoOpcional(datos.telefono, 'telefono', 16),
    idProcedencia: procedencia(datos.idProcedencia),
  };
}