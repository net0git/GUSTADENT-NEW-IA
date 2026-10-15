import { AppError } from '../../../../shared/errors/app-error';
import { PacientesRepository } from '../ports/pacientes.repository';
import { CondicionPaciente, DatosPaciente, Paciente } from '../../domain/paciente';

const PACIENTE_NO_ENCONTRADO = 'PACIENTE_NO_ENCONTRADO';
const CONDICION_NO_ENCONTRADA = 'CONDICION_NO_ENCONTRADA';
const LONGITUD_MAXIMA_CONDICION = 500;

export class ListarPacientesUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  execute(terminoBusqueda: string | null): Promise<Paciente[]> {
    const termino = terminoBusqueda?.trim() ?? '';
    return this.pacientes.listar(termino === '' ? null : termino);
  }
}

export class ObtenerPacienteUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  async execute(id: number): Promise<Paciente> {
    const paciente = await this.pacientes.obtenerPorId(id);
    if (!paciente) {
      throw new AppError(404, 'PACIENTE_NO_ENCONTRADO', 'El paciente no existe');
    }
    return paciente;
  }
}

export class CrearPacienteUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  async execute(datos: DatosPaciente): Promise<Paciente> {
    const id = await this.pacientes.crear(datos);
    return this.obtener(id);
  }

  private async obtener(id: number): Promise<Paciente> {
    const paciente = await this.pacientes.obtenerPorId(id);
    if (!paciente) {
      throw new AppError(500, 'ERROR_INTERNO', 'No se pudo leer el paciente recién creado');
    }
    return paciente;
  }
}

export class ActualizarPacienteUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  async execute(id: number, datos: DatosPaciente): Promise<Paciente> {
    const paciente = await this.pacientes.obtenerPorId(id);
    if (!paciente) {
      throw new AppError(404, 'PACIENTE_NO_ENCONTRADO', 'El paciente no existe');
    }

    await this.pacientes.actualizar(id, datos);

    const actualizado = await this.pacientes.obtenerPorId(id);
    if (!actualizado) {
      throw new AppError(500, 'ERROR_INTERNO', 'No se pudo leer el paciente actualizado');
    }
    return actualizado;
  }
}

/** Condiciones del paciente: la lista de lo que hay que saber antes de atenderlo. */
export class ListarCondicionesUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  async execute(idPaciente: number, soloActivas: boolean): Promise<CondicionPaciente[]> {
    await exigirPaciente(this.pacientes, idPaciente);
    return this.pacientes.listarCondiciones(idPaciente, soloActivas);
  }
}

export class CrearCondicionUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  /** idAtencionAlta solo se llena cuando la condicion se registra desde una cita. */
  async execute(
    idPaciente: number,
    descripcion: string,
    idUsuario: number,
    idAtencionAlta: number | null = null
  ): Promise<CondicionPaciente> {
    await exigirPaciente(this.pacientes, idPaciente);
    const texto = exigirTexto(descripcion);

    const id = await this.pacientes.crearCondicion(idPaciente, texto, idUsuario, idAtencionAlta);
    const creada = await this.pacientes.obtenerCondicion(id);
    if (!creada) {
      throw new AppError(500, 'ERROR_INTERNO', 'No se pudo leer la condición recién creada');
    }
    return creada;
  }
}

export class ActualizarCondicionUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  async execute(id: number, descripcion: string): Promise<CondicionPaciente> {
    await exigirCondicion(this.pacientes, id);
    const texto = exigirTexto(descripcion);
    await this.pacientes.actualizarCondicion(id, texto);
    return leerCondicion(this.pacientes, id);
  }
}

/** Quitar no borra: deja la condicion registrada pero desactivada. */
export class CambiarEstadoCondicionUseCase {
  constructor(private readonly pacientes: PacientesRepository) {}

  async execute(id: number, activo: boolean): Promise<CondicionPaciente> {
    await exigirCondicion(this.pacientes, id);
    await this.pacientes.cambiarEstadoCondicion(id, activo);
    return leerCondicion(this.pacientes, id);
  }
}

async function leerCondicion(
  pacientes: PacientesRepository,
  id: number
): Promise<CondicionPaciente> {
  const condicion = await pacientes.obtenerCondicion(id);
  if (!condicion) {
    throw new AppError(500, 'ERROR_INTERNO', 'No se pudo leer la condición');
  }
  return condicion;
}

async function exigirCondicion(pacientes: PacientesRepository, id: number): Promise<void> {
  const condicion = await pacientes.obtenerCondicion(id);
  if (!condicion) {
    throw new AppError(404, CONDICION_NO_ENCONTRADA, 'La condición no existe');
  }
}

function exigirTexto(descripcion: string): string {
  const texto = descripcion.trim();

  if (texto === '') {
    throw new AppError(400, 'VALIDACION', 'La condición no puede estar vacía');
  }
  if (texto.length > LONGITUD_MAXIMA_CONDICION) {
    throw new AppError(
      400,
      'VALIDACION',
      `La condición no puede tener más de ${LONGITUD_MAXIMA_CONDICION} caracteres`
    );
  }

  return texto;
}

async function exigirPaciente(pacientes: PacientesRepository, idPaciente: number): Promise<void> {
  const paciente = await pacientes.obtenerPorId(idPaciente);
  if (!paciente) {
    throw new AppError(404, PACIENTE_NO_ENCONTRADO, 'El paciente no existe');
  }
}