/**
 * Fecha local en formato AAAA-MM-DD.
 *
 * No usar `toISOString()`: devuelve la fecha en UTC, que puede ser un dia
 * distinto al del reloj del usuario y queda congelada al abrir el componente.
 */
export function hoyIso(): string {
  const ahora = new Date();
  return aIso(ahora);
}

export function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Parte HH:mm de una fecha local, sin pasar por UTC. */
export function horaIso(fecha: Date): string {
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}