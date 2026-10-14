import { AppError } from '../../../shared/errors/app-error';
import { diasEntre } from '../../../shared/fechas/fechas';
import {
  objetoDeCuerpo,
  textoOpcional,
  textoRequerido,
} from '../../../shared/validation/validadores';
import { DatosAtencion, DatosAtencionSesion, DatosSesionIngresados, EstadoAtencion, FiltrosAtencion, FiltrosSesion } from '../domain/atencion';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_FECHA_HORA = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/;
const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HORA_INICIO_ATENCION = 7;
const HORA_LIMITE_ATENCION = 20 * 60;

/** La atencion se agenda entre las 7:00 y las 8:00 PM. */
function exigirHorarioValido(horas: number, minutos: number): void {
  const minutosDelDia = horas * 60 + minutos;
  if (minutosDelDia < HORA_INICIO_ATENCION * 60 || minutosDelDia > HORA_LIMITE_ATENCION) {
    throw new AppError(
      400,
      'HORARIO_FUERA_DE_RANGO',
      'El horario debe estar entre las 7:00 AM y las 8:00 PM'
    );
  }
}

/** Horario de la cita en formato HH:mm. */
export function validarHoraCita(valor: unknown): string {
  const texto = textoRequerido(valor, 'hora', 5);
  const partes = FORMATO_HORA.exec(texto);
  if (!partes) {
    throw new AppError(400, 'VALIDACION', 'El campo hora debe tener el formato HH:mm');
  }
  exigirHorarioValido(Number(partes[1]), Number(partes[2]));
  return texto;
}
const ESTADOS_ATENCION: readonly EstadoAtencion[] = ['borrador', 'activo', 'finalizado', 'anulado'];
/** El calendario pide un mes, con los dias de los meses vecinos que se reachan. */
const DIAS_MAXIMO_CALENDARIO = 62;
const LONGITUD_MAXIMA_DESCRIPCION = 2000;
const CERO = 0;

export function validarIdentificador(valor: unknown, campo: string): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} no es válido`);
  }
  return valor;
}

function idDeRuta(parametro: unknown): number {
  const numero = Number(parametro);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(400, 'VALIDACION', 'El identificador no es válido');
  }
  return numero;
}

function fecha(valor: unknown, campo: string): string {
  const texto = textoRequerido(valor, campo, 10);
  if (!FORMATO_FECHA.test(texto)) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} debe tener el formato AAAA-MM-DD`);
  }
  return texto;
}

/** Las citas se agendan entre las 7:00 y las 8:00 PM. */
function fechaHora(valor: unknown): string {
  const texto = textoRequerido(valor, 'fechaHora', 40);
  const partes = FORMATO_FECHA_HORA.exec(texto);

  if (!partes) {
    throw new AppError(400, 'VALIDACION', 'El campo fechaHora no tiene el formato esperado');
  }

  const horas = Number(partes[2]);
  const minutos = Number(partes[3]);

  exigirHorarioValido(horas, minutos);

  const instante = new Date(texto);
  if (Number.isNaN(instante.getTime())) {
    throw new AppError(400, 'VALIDACION', 'El campo fechaHora no es una fecha válida');
  }

  return instante.toISOString();
}

function monto(valor: unknown, campo: string): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} debe ser un número`);
  }
  const redondeado = Math.round(valor * 100) / 100;
  if (redondeado < CERO) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} no puede ser negativo`);
  }
  return redondeado;
}

export function validarDatosAtencion(cuerpo: unknown): DatosAtencion {
  const datos = objetoDeCuerpo(cuerpo);
  const costo = monto(datos.costo, 'costo');
  const descuento = monto(datos.descuento, 'descuento');

  if (descuento > costo) {
    throw new AppError(400, 'VALIDACION', 'El descuento no puede ser mayor que el costo');
  }

  return {
    idPaciente: validarIdentificador(datos.idPaciente, 'idPaciente'),
    idSucursal: validarIdentificador(datos.idSucursal, 'idSucursal'),
    idUsuario: validarIdentificador(datos.idUsuario, 'idUsuario'),
    fecha: fecha(datos.fecha, 'fecha'),
    hora: validarHoraCita(datos.hora),
    descripcion: textoOpcional(datos.descripcion, 'descripcion', LONGITUD_MAXIMA_DESCRIPCION),
    costo,
    descuento,
  };
}

export function validarDatosSesion(cuerpo: unknown): DatosSesionIngresados {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    fechaHora: fechaHora(datos.fechaHora),
    observaciones: textoOpcional(datos.observaciones, 'observaciones', LONGITUD_MAXIMA_DESCRIPCION),
    monto: monto(datos.monto, 'monto'),
  };
}

export function validarObservaciones(cuerpo: unknown): string | null {
  const datos = objetoDeCuerpo(cuerpo);
  return textoOpcional(datos.observaciones, 'observaciones', LONGITUD_MAXIMA_DESCRIPCION);
}

/** Al atender, el monto es opcional: si no se envia se conserva el de la sesion. */
function montoOpcional(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  return monto(valor, 'monto');
}

export function validarAtencionSesion(cuerpo: unknown): DatosAtencionSesion {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    observaciones: textoOpcional(datos.observaciones, 'observaciones', LONGITUD_MAXIMA_DESCRIPCION),
    monto: montoOpcional(datos.monto),
  };
}

export function validarFiltros(consulta: Record<string, unknown>): FiltrosAtencion {
  const filtros: FiltrosAtencion = {};

  if (consulta.fecha !== undefined) {
    filtros.fecha = fecha(consulta.fecha, 'fecha');
  }
  if (consulta.sucursal !== undefined) {
    filtros.idSucursal = validarIdentificador(Number(consulta.sucursal), 'sucursal');
  }
  if (consulta.medico !== undefined) {
    filtros.idUsuario = validarIdentificador(Number(consulta.medico), 'medico');
  }
  if (consulta.paciente !== undefined) {
    filtros.idPaciente = validarIdentificador(Number(consulta.paciente), 'paciente');
  }
  if (consulta.estado !== undefined) {
    if (typeof consulta.estado !== 'string' || !ESTADOS_ATENCION.includes(consulta.estado as EstadoAtencion)) {
      throw new AppError(
        400,
        'VALIDACION',
        `El estado debe ser uno de: ${ESTADOS_ATENCION.join(', ')}`
      );
    }
    filtros.estado = consulta.estado as EstadoAtencion;
  }

  return filtros;
}

export function validarFiltrosSesion(consulta: Record<string, unknown>): FiltrosSesion {
  const filtros: FiltrosSesion = {};
  if (consulta.fecha !== undefined) {
    filtros.fecha = fecha(consulta.fecha, 'fecha');
  }
  if (consulta.desde !== undefined) {
    filtros.desde = fecha(consulta.desde, 'desde');
  }
  if (consulta.hasta !== undefined) {
    filtros.hasta = fecha(consulta.hasta, 'hasta');
  }
  return filtros;
}

/** El calendario pide el mes que se esta viendo; el rango se acota para no traer de mas. */
export function validarRangoCalendario(consulta: Record<string, unknown>): { desde: string; hasta: string } {
  const desde = fecha(consulta.desde, 'desde');
  const hasta = fecha(consulta.hasta, 'hasta');

  if (desde > hasta) {
    throw new AppError(400, 'VALIDACION', 'La fecha inicial no puede ser posterior a la final');
  }

  if (diasEntre(desde, hasta) > DIAS_MAXIMO_CALENDARIO) {
    throw new AppError(400, 'VALIDACION', 'El rango del calendario no puede superar los 62 días');
  }

  return { desde, hasta };
}

export { idDeRuta };