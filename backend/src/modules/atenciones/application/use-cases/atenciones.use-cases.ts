import { AppError } from '../../../../shared/errors/app-error';
import { AtencionesRepository } from '../ports/atenciones.repository';
import {
  Atencion,
  DatosAtencion,
  DatosAtencionSesion,
  DatosSesion,
  DatosSesionIngresados,
  FiltrosAtencion,
  FiltrosSesion,
  ResumenDia,
  Sesion,
  SesionCita,
} from '../../domain/atencion';

const ATENCION_NO_ENCONTRADA = 'ATENCION_NO_ENCONTRADA';
const SESION_NO_ENCONTRADA = 'SESION_NO_ENCONTRADA';
const ESTADO_NO_PERMITIDO = 'ESTADO_NO_PERMITIDO';
const SESIONES_PENDIENTES = 'SESIONES_PENDIENTES';
const DEUDA_NEGATIVA = 'MONTO_EXCEDE_TOTAL';

async function obtenerAtencionExistente(
  atenciones: AtencionesRepository,
  id: number
): Promise<Atencion> {
  const atencion = await atenciones.obtenerPorId(id);
  if (!atencion) {
    throw new AppError(404, ATENCION_NO_ENCONTRADA, 'La atención no existe');
  }
  return atencion;
}

async function obtenerSesionExistente(
  atenciones: AtencionesRepository,
  id: number
): Promise<Sesion> {
  const sesion = await atenciones.obtenerSesion(id);
  if (!sesion) {
    throw new AppError(404, SESION_NO_ENCONTRADA, 'La sesión no existe');
  }
  return sesion;
}

/** Impide modificar una atención anulada: ya no tiene efecto clínico ni económico. */
function exigirEstadoEditable(atencion: Atencion): void {
  if (atencion.estado === 'anulado') {
    throw new AppError(409, ESTADO_NO_PERMITIDO, 'La atención está anulada y no admite cambios');
  }
}

/**
 * La deuda de una atención es `costo - descuento - pagado`, así que el total de
 * los montos de las sesiones no puede pasar de lo indicado: si lo pasara, la
 * deuda quedaría negativa.
 */
function exigirSinDeudaNegativa(limite: number, montoSesiones: number): void {
  if (montoSesiones > limite) {
    throw new AppError(
      409,
      DEUDA_NEGATIVA,
      `El total de las sesiones (S/ ${montoSesiones.toFixed(
        2
      )}) supera el monto indicado de la atención (S/ ${limite.toFixed(2)})`
    );
  }
}

/** Suma prevista de las sesiones del ticket y la valida contra lo indicado. */
async function exigirMontoDeSesion(
  atenciones: AtencionesRepository,
  idTicket: number,
  montoASumar: number,
  sesionReemplazada?: Sesion
): Promise<void> {
  const { limite, montoSesiones } = await atenciones.obtenerTotalesSesiones(idTicket);
  const yaSumado = sesionReemplazada ? montoSesiones - sesionReemplazada.monto : montoSesiones;
  exigirSinDeudaNegativa(limite, yaSumado + montoASumar);
}

export class ListarAtencionesUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  execute(filtros: FiltrosAtencion): Promise<Atencion[]> {
    return this.atenciones.listar(filtros);
  }
}

/** Las sesiones son las citas concretas del cronograma. */
export class ListarSesionesCitasUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  execute(filtros: FiltrosSesion): Promise<SesionCita[]> {
    return this.atenciones.listarSesionesCitas(filtros);
  }
}

/** Dias con citas pendientes, para marcar el calendario del menu lateral. */
export class ListarResumenCalendarioUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  execute(desde: string, hasta: string): Promise<ResumenDia[]> {
    return this.atenciones.listarResumenCalendario(desde, hasta);
  }
}

export class ObtenerAtencionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  execute(id: number): Promise<Atencion> {
    return obtenerAtencionExistente(this.atenciones, id);
  }
}

export class CrearAtencionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  /**
   * Cada cita abre su propio cronograma: al crearla se genera de inmediato la
   * primera sesion, con la misma fecha y horario de la cita.
   */
  async execute(datos: DatosAtencion, idUsuario: number): Promise<Atencion> {
    const id = await this.atenciones.crear(datos);

    await this.atenciones.crearSesion(
      id,
      {
        numero: 1,
        tipo: 'primera',
        fechaHora: `${datos.fecha}T${datos.hora}:00`,
        observaciones: null,
        monto: 0,
      },
      idUsuario
    );

    return obtenerAtencionExistente(this.atenciones, id);
  }
}

export class GuardarBorradorUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(id: number, datos: DatosAtencion): Promise<Atencion> {
    const atencion = await obtenerAtencionExistente(this.atenciones, id);
    exigirEstadoEditable(atencion);

    if (atencion.estado === 'finalizado') {
      throw new AppError(409, ESTADO_NO_PERMITIDO, 'La atención está finalizada y no admite cambios');
    }

    // Bajar el costo o subir el descuento no puede dejar las sesiones por encima.
    const { montoSesiones } = await this.atenciones.obtenerTotalesSesiones(id);
    exigirSinDeudaNegativa(datos.costo - datos.descuento, montoSesiones);

    await this.atenciones.actualizarDatos(id, datos);
    return obtenerAtencionExistente(this.atenciones, id);
  }
}

export class ActivarAtencionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(id: number): Promise<Atencion> {
    const atencion = await obtenerAtencionExistente(this.atenciones, id);
    exigirEstadoEditable(atencion);

    if (atencion.estado === 'finalizado') {
      throw new AppError(409, ESTADO_NO_PERMITIDO, 'La atención está finalizada');
    }

    await this.atenciones.cambiarEstado(id, 'activo');
    return obtenerAtencionExistente(this.atenciones, id);
  }
}

export class FinalizarAtencionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(id: number): Promise<Atencion> {
    const atencion = await obtenerAtencionExistente(this.atenciones, id);
    exigirEstadoEditable(atencion);

    if (atencion.estado === 'finalizado') {
      return atencion;
    }

    const pendientes = await this.atenciones.contarSesionesProgramadas(id);
    if (pendientes > 0) {
      throw new AppError(
        409,
        SESIONES_PENDIENTES,
        `Quedan ${pendientes} sesión(es) sin atender. Atiéndelas o cancélalas antes de finalizar`
      );
    }

    await this.atenciones.cambiarEstado(id, 'finalizado');
    return obtenerAtencionExistente(this.atenciones, id);
  }
}

export class AnularAtencionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(id: number): Promise<Atencion> {
    const atencion = await obtenerAtencionExistente(this.atenciones, id);
    if (atencion.estado === 'anulado') {
      return atencion;
    }
    await this.atenciones.cambiarEstado(id, 'anulado');
    return obtenerAtencionExistente(this.atenciones, id);
  }
}

export class CrearSesionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(
    idTicket: number,
    entrada: DatosSesionIngresados,
    idUsuario: number
  ): Promise<Sesion> {
    const atencion = await obtenerAtencionExistente(this.atenciones, idTicket);
    exigirEstadoEditable(atencion);

    if (atencion.estado === 'finalizado') {
      throw new AppError(409, ESTADO_NO_PERMITIDO, 'La atención está finalizada');
    }

    const ultima = await this.atenciones.obtenerUltimaSesion(idTicket);
    const numero = ultima ? ultima.numero + 1 : 1;
    const datos: DatosSesion = {
      ...entrada,
      numero,
      tipo: numero === 1 ? 'primera' : 'sesion',
    };

    await exigirMontoDeSesion(this.atenciones, idTicket, datos.monto);

    const id = await this.atenciones.crearSesion(idTicket, datos, idUsuario);
    return obtenerSesionExistente(this.atenciones, id);
  }
}

export class ActualizarSesionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(id: number, datos: DatosSesionIngresados): Promise<Sesion> {
    const sesion = await obtenerSesionExistente(this.atenciones, id);
    exigirEstadoEditable(await obtenerAtencionExistente(this.atenciones, sesion.idTicket));

    await exigirMontoDeSesion(this.atenciones, sesion.idTicket, datos.monto, sesion);

    await this.atenciones.actualizarSesion(id, datos);
    return obtenerSesionExistente(this.atenciones, id);
  }
}

export class AtenderSesionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(
    id: number,
    idUsuario: number,
    datos: DatosAtencionSesion
  ): Promise<Sesion> {
    const sesion = await obtenerSesionExistente(this.atenciones, id);
    exigirEstadoEditable(await obtenerAtencionExistente(this.atenciones, sesion.idTicket));

    if (sesion.estado === 'cancelado') {
      throw new AppError(409, ESTADO_NO_PERMITIDO, 'La sesión está cancelada y no se puede atender');
    }

    if (datos.monto !== null) {
      await exigirMontoDeSesion(this.atenciones, sesion.idTicket, datos.monto, sesion);
    }

    await this.atenciones.atenderSesion(id, idUsuario, datos);
    return obtenerSesionExistente(this.atenciones, id);
  }
}

export class CancelarSesionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(id: number): Promise<Sesion> {
    const sesion = await obtenerSesionExistente(this.atenciones, id);
    exigirEstadoEditable(await obtenerAtencionExistente(this.atenciones, sesion.idTicket));

    if (sesion.estado === 'atendido') {
      throw new AppError(409, ESTADO_NO_PERMITIDO, 'Una sesión atendida no se puede cancelar');
    }

    await this.atenciones.cancelarSesion(id);
    return obtenerSesionExistente(this.atenciones, id);
  }
}

export class EliminarSesionUseCase {
  constructor(private readonly atenciones: AtencionesRepository) {}

  async execute(id: number): Promise<void> {
    const sesion = await obtenerSesionExistente(this.atenciones, id);
    exigirEstadoEditable(await obtenerAtencionExistente(this.atenciones, sesion.idTicket));

    await this.atenciones.eliminarSesion(id);
  }
}