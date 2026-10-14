import { AppError } from '../../../../shared/errors/app-error';
import { PacientesRepository } from '../ports/pacientes.repository';
import { DatosPaciente, Paciente } from '../../domain/paciente';

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