import { Perfil } from './models/usuario.model';

/**
 * Qué perfiles pueden entrar a cada sección de Administración.
 *
 * Es la única fuente de verdad: la usan las rutas (guards) y el menú lateral,
 * así no se desincronizan cuando cambian los permisos.
 */
export const ACCESO = {
  atenciones: ['administrador', 'odontologo', 'recepcion'],
  pacientes: ['administrador', 'odontologo', 'recepcion'],
  catalogos: ['administrador', 'recepcion'],
  usuarios: ['administrador', 'recepcion'],
  reportes: ['administrador'],
  configuracion: ['administrador'],
} as const satisfies Record<string, readonly Perfil[]>;

export type Seccion = keyof typeof ACCESO;

/** Indica si el perfil puede ver la sección indicada. */
export function puedeVer(perfil: Perfil | null | undefined, seccion: Seccion): boolean {
  return perfil != null && (ACCESO[seccion] as readonly Perfil[]).includes(perfil);
}
