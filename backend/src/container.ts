import { BcryptPasswordHasher } from './modules/auth/infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './modules/auth/infrastructure/jwt-token-service';
import { PgUsuarioAuthRepository } from './modules/auth/infrastructure/pg-usuario-auth.repository';
import { CambiarPasswordUseCase } from './modules/auth/application/use-cases/cambiar-password.use-case';
import { LoginUseCase } from './modules/auth/application/use-cases/login.use-case';
import { LogoutUseCase } from './modules/auth/application/use-cases/logout.use-case';
import { VerificarSesionUseCase } from './modules/auth/application/use-cases/verificar-sesion.use-case';
import { PgSetupRepository } from './modules/setup/infrastructure/pg-setup.repository';
import {
  ObtenerEstadoSetupUseCase,
  RegistrarAdministradorSetupUseCase,
  RegistrarEmpresaSetupUseCase,
  RegistrarSucursalSetupUseCase,
} from './modules/setup/application/use-cases/configuracion-inicial.use-cases';
import { PgUsuariosRepository } from './modules/usuarios/infrastructure/pg-usuarios.repository';
import {
  ActualizarUsuarioUseCase,
  AsignarSucursalesUseCase,
  CambiarEstadoUsuarioUseCase,
  CrearUsuarioUseCase,
  ListarOdontologosUseCase,
  ListarUsuariosUseCase,
  ObtenerUsuarioUseCase,
  ResetearPasswordUseCase,
} from './modules/usuarios/application/use-cases/usuarios.use-cases';
import { PgAtencionesRepository } from './modules/atenciones/infrastructure/pg-atenciones.repository';
import {
  ActivarAtencionUseCase,
  ActualizarSesionUseCase,
  AnularAtencionUseCase,
  AtenderSesionUseCase,
  CancelarSesionUseCase,
  CrearAtencionUseCase,
  CrearSesionUseCase,
  EliminarSesionUseCase,
  FinalizarAtencionUseCase,
  GuardarBorradorUseCase,
  ListarAtencionesUseCase,
  ListarSesionesCitasUseCase,
  ListarResumenCalendarioUseCase,
  ObtenerAtencionUseCase,
} from './modules/atenciones/application/use-cases/atenciones.use-cases';
import { PgPacientesRepository } from './modules/pacientes/infrastructure/pg-pacientes.repository';
import {
  ActualizarPacienteUseCase,
  ActualizarCondicionUseCase,
  CambiarEstadoCondicionUseCase,
  CrearCondicionUseCase,
  CrearPacienteUseCase,
  ListarCondicionesUseCase,
  ListarPacientesUseCase,
  ObtenerPacienteUseCase,
} from './modules/pacientes/application/use-cases/pacientes.use-cases';
import { PgReportesRepository } from './modules/reportes/infrastructure/pg-reportes.repository';
import {
  AtencionesPorMesUseCase,
  CuentasPorCobrarUseCase,
  IngresosPorSesionUseCase,
  ProductividadPorOdontologoUseCase,
  ResumenAtencionesUseCase,
} from './modules/reportes/application/use-cases/reportes.use-cases';
import { PgSucursalesRepository } from './modules/sucursales/infrastructure/pg-sucursales.repository';
import { PgProcedenciasRepository } from './modules/procedencias/infrastructure/pg-procedencias.repository';
import { crearCasosDeUsoCatalogo } from './shared/catalogos/casos-de-uso-catalogo';

const usuarioAuthRepository = new PgUsuarioAuthRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();

export const authContainer = {
  login: new LoginUseCase(usuarioAuthRepository, passwordHasher, tokenService),
  verificarSesion: new VerificarSesionUseCase(usuarioAuthRepository, tokenService),
  logout: new LogoutUseCase(usuarioAuthRepository),
  cambiarPassword: new CambiarPasswordUseCase(usuarioAuthRepository, passwordHasher),
};

const setupRepository = new PgSetupRepository();

export const setupContainer = {
  obtenerEstado: new ObtenerEstadoSetupUseCase(setupRepository),
  registrarEmpresa: new RegistrarEmpresaSetupUseCase(setupRepository),
  registrarSucursal: new RegistrarSucursalSetupUseCase(setupRepository),
  registrarAdministrador: new RegistrarAdministradorSetupUseCase(setupRepository, passwordHasher),
};

const usuariosRepository = new PgUsuariosRepository();

export const usuariosContainer = {
  listar: new ListarUsuariosUseCase(usuariosRepository),
  listarOdontologos: new ListarOdontologosUseCase(usuariosRepository),
  obtener: new ObtenerUsuarioUseCase(usuariosRepository),
  crear: new CrearUsuarioUseCase(usuariosRepository, passwordHasher),
  actualizar: new ActualizarUsuarioUseCase(usuariosRepository),
  cambiarEstado: new CambiarEstadoUsuarioUseCase(usuariosRepository),
  resetearPassword: new ResetearPasswordUseCase(usuariosRepository, passwordHasher),
  asignarSucursales: new AsignarSucursalesUseCase(usuariosRepository),
};

const sucursalesRepository = new PgSucursalesRepository();

export const sucursalesContainer = {
  catalogo: crearCasosDeUsoCatalogo(sucursalesRepository),
};

const procedenciasRepository = new PgProcedenciasRepository();

export const procedenciasContainer = {
  catalogo: crearCasosDeUsoCatalogo(procedenciasRepository),
};

const pacientesRepository = new PgPacientesRepository();

export const pacientesContainer = {
  listar: new ListarPacientesUseCase(pacientesRepository),
  obtener: new ObtenerPacienteUseCase(pacientesRepository),
  crear: new CrearPacienteUseCase(pacientesRepository),
  actualizar: new ActualizarPacienteUseCase(pacientesRepository),
  listarCondiciones: new ListarCondicionesUseCase(pacientesRepository),
  crearCondicion: new CrearCondicionUseCase(pacientesRepository),
  actualizarCondicion: new ActualizarCondicionUseCase(pacientesRepository),
  cambiarEstadoCondicion: new CambiarEstadoCondicionUseCase(pacientesRepository),
};

const atencionesRepository = new PgAtencionesRepository();

export const atencionesContainer = {
  listar: new ListarAtencionesUseCase(atencionesRepository),
  listarSesionesCitas: new ListarSesionesCitasUseCase(atencionesRepository),
  listarResumenCalendario: new ListarResumenCalendarioUseCase(atencionesRepository),
  obtener: new ObtenerAtencionUseCase(atencionesRepository),
  crear: new CrearAtencionUseCase(atencionesRepository),
  guardarBorrador: new GuardarBorradorUseCase(atencionesRepository),
  activar: new ActivarAtencionUseCase(atencionesRepository),
  finalizar: new FinalizarAtencionUseCase(atencionesRepository),
  anular: new AnularAtencionUseCase(atencionesRepository),
  crearSesion: new CrearSesionUseCase(atencionesRepository),
  actualizarSesion: new ActualizarSesionUseCase(atencionesRepository),
  atenderSesion: new AtenderSesionUseCase(atencionesRepository),
  cancelarSesion: new CancelarSesionUseCase(atencionesRepository),
  eliminarSesion: new EliminarSesionUseCase(atencionesRepository),
};

const reportesRepository = new PgReportesRepository();

export const reportesContainer = {
  resumenAtenciones: new ResumenAtencionesUseCase(reportesRepository),
  ingresosPorSesion: new IngresosPorSesionUseCase(reportesRepository),
  productividad: new ProductividadPorOdontologoUseCase(reportesRepository),
  cuentasPorCobrar: new CuentasPorCobrarUseCase(reportesRepository),
  atencionesPorMes: new AtencionesPorMesUseCase(reportesRepository),
};
