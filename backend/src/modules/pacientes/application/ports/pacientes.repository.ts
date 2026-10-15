import { CondicionPaciente, DatosPaciente, Paciente } from '../../domain/paciente';

export interface PacientesRepository {
  listar(terminoBusqueda: string | null): Promise<Paciente[]>;
  obtenerPorId(id: number): Promise<Paciente | null>;
  crear(datos: DatosPaciente): Promise<number>;
  actualizar(id: number, datos: DatosPaciente): Promise<boolean>;

  listarCondiciones(idPaciente: number, soloActivas: boolean): Promise<CondicionPaciente[]>;
  obtenerCondicion(id: number): Promise<CondicionPaciente | null>;
  crearCondicion(
    idPaciente: number,
    descripcion: string,
    idUsuario: number,
    idAtencionAlta: number | null
  ): Promise<number>;
  actualizarCondicion(id: number, descripcion: string): Promise<boolean>;
  cambiarEstadoCondicion(id: number, activo: boolean): Promise<boolean>;
}