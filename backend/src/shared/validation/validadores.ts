import { AppError } from '../errors/app-error';

export function objetoDeCuerpo(cuerpo: unknown): Record<string, unknown> {
  return cuerpo !== null && typeof cuerpo === 'object' ? (cuerpo as Record<string, unknown>) : {};
}

export function textoRequerido(valor: unknown, campo: string, maximo: number): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} es obligatorio`);
  }

  const limpio = valor.trim();
  if (limpio.length > maximo) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} no puede tener más de ${maximo} caracteres`);
  }

  return limpio;
}

export function textoOpcional(valor: unknown, campo: string, maximo: number): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  return textoRequerido(valor, campo, maximo);
}

export function conFormato(valor: string, expresion: RegExp, campo: string, requisito: string): string {
  if (!expresion.test(valor)) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} ${requisito}`);
  }
  return valor;
}

export function secretoRequerido(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor === '') {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} es obligatorio`);
  }
  if (valor.length > 72) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} no puede tener más de 72 caracteres`);
  }
  return valor;
}

export function passwordNueva(valor: unknown, campo: string): string {
  const minimo = 8;
  const maximo = 72;

  if (typeof valor !== 'string' || valor.length < minimo) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} debe tener al menos ${minimo} caracteres`);
  }
  if (valor.length > maximo) {
    throw new AppError(400, 'VALIDACION', `El campo ${campo} no puede tener más de ${maximo} caracteres`);
  }

  return valor;
}
