import { DatosPaciente, Paciente } from '../../domain/paciente';

export interface PacientesRepository {
  listar(terminoBusqueda: string | null): Promise<Paciente[]>;
  obtenerPorId(id: number): Promise<Paciente | null>;
  crear(datos: DatosPaciente): Promise<number>;
  actualizar(id: number, datos: DatosPaciente): Promise<boolean>;
}