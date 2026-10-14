import { AppError } from '../../../shared/errors/app-error';
import { diasEntre, hoyIso, primerDiaDelMesIso } from '../../../shared/fechas/fechas';
import { FiltrosReporte } from '../domain/reporte';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
/** Dos años: alcanza para el reporte mensual y mantiene acotada la serie diaria. */
const DIAS_MAXIMO = 730;

function fecha(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !FORMATO_FECHA.test(valor)) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} debe tener el formato AAAA-MM-DD`);
  }

  if (Number.isNaN(new Date(`${valor}T00:00:00`).getTime())) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} no es una fecha válida`);
  }

  return valor;
}

function identificadorOpcional(valor: unknown, campo: string): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} no es válido`);
  }

  return numero;
}

/**
 * Sin rango explicito se toma el mes en curso: es el periodo que se revisa todos
 * los dias en la clinica.
 */
export function validarFiltrosReporte(consulta: Record<string, unknown>): FiltrosReporte {
  const hoy = hoyIso();
  const desde = fecha(consulta.desde ?? primerDiaDelMesIso(hoy), 'desde');
  const hasta = fecha(consulta.hasta ?? hoy, 'hasta');

  if (desde > hasta) {
    throw new AppError(400, 'VALIDACION', 'La fecha inicial no puede ser posterior a la final');
  }

  if (diasEntre(desde, hasta) > DIAS_MAXIMO) {
    throw new AppError(400, 'VALIDACION', 'El rango no puede superar los 24 meses');
  }

  return {
    desde,
    hasta,
    idSucursal: identificadorOpcional(consulta.sucursal, 'sucursal'),
    idUsuario: identificadorOpcional(consulta.medico, 'medico'),
  };
}

/** Cuentas por cobrar es una foto del estado actual: no admite rango de fechas. */
export function validarSucursalReporte(consulta: Record<string, unknown>): number | null {
  return identificadorOpcional(consulta.sucursal, 'sucursal');
}