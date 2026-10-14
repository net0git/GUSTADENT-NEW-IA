import { AppError } from '../../../../shared/errors/app-error';
import { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';
import {
  AdministradorSetup,
  EmpresaSetup,
  EstadoSetup,
  SetupRepository,
  SucursalSetup,
} from '../ports/setup.repository';

export interface AdministradorSetupInput {
  username: string;
  password: string;
  dni: string;
  nombreCompleto: string;
}

const PASO_YA_CONFIGURADO = 'Este paso ya fue configurado';

export class ObtenerEstadoSetupUseCase {
  constructor(private readonly setup: SetupRepository) {}

  async execute(): Promise<EstadoSetup & { configurado: boolean }> {
    const estado = await this.setup.obtenerEstado();
    return {
      ...estado,
      configurado: estado.empresa && estado.sucursal && estado.administrador,
    };
  }
}

export class RegistrarEmpresaSetupUseCase {
  constructor(private readonly setup: SetupRepository) {}

  async execute(datos: EmpresaSetup): Promise<void> {
    const registrada = await this.setup.registrarEmpresa(datos);
    if (!registrada) {
      throw new AppError(409, 'PASO_YA_CONFIGURADO', PASO_YA_CONFIGURADO);
    }
  }
}

export class RegistrarSucursalSetupUseCase {
  constructor(private readonly setup: SetupRepository) {}

  async execute(datos: SucursalSetup): Promise<void> {
    const registrada = await this.setup.registrarSucursal(datos);
    if (!registrada) {
      throw new AppError(409, 'PASO_YA_CONFIGURADO', PASO_YA_CONFIGURADO);
    }
  }
}

export class RegistrarAdministradorSetupUseCase {
  constructor(
    private readonly setup: SetupRepository,
    private readonly hasher: PasswordHasher
  ) {}

  async execute(entrada: AdministradorSetupInput): Promise<void> {
    const datos: AdministradorSetup = {
      username: entrada.username,
      passwordHash: await this.hasher.generar(entrada.password),
      dni: entrada.dni,
      nombreCompleto: entrada.nombreCompleto,
    };

    const registrado = await this.setup.registrarAdministrador(datos);
    if (!registrado) {
      throw new AppError(409, 'PASO_YA_CONFIGURADO', PASO_YA_CONFIGURADO);
    }
  }
}
