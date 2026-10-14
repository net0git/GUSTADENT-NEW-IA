import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DNI_PATTERN = /^\d{8}$/;
/** Nombres y apellidos con tildes y ñ. */
const NOMBRE_PATTERN = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,60}$/;

/** Se puede buscar por DNI completo o por nombre y apellidos. */
export function dniONombre(): ValidatorFn {
  return (control: AbstractControl) => {
    const texto = (control.value ?? '').toString().trim();

    if (DNI_PATTERN.test(texto) || NOMBRE_PATTERN.test(texto)) {
      return null;
    }

    return { dniONombre: true } satisfies ValidationErrors;
  };
}

export function mensajeDeError(control: AbstractControl): string {
  const errores = control.errors ?? {};
  if (errores['required']) return 'Este campo es obligatorio';
  if (errores['dniONombre']) return 'Escribe un DNI de 8 dígitos o un nombre de al menos 3 letras';
  if (errores['excedeTotal']) return errores['excedeTotal'].mensaje;
  if (errores['min']) return `No puede ser menor que ${errores['min'].min}`;
  if (errores['maxlength']) return `No puede tener más de ${errores['maxlength'].requiredLength} caracteres`;
  if (errores['minlength']) return `Debe tener al menos ${errores['minlength'].requiredLength} caracteres`;
  if (errores['pattern']) return 'El formato no es válido';
  return 'Revisa este campo';
}

export function campoInvalido(control: AbstractControl): boolean {
  return control.invalid && (control.touched || control.dirty);
}

/**
 * El monto de una sesion no puede pasar de lo que queda libre en la atencion
 * (`costo - descuento`), porque la deuda nunca puede ser negativa. El error
 * lleva su propio mensaje para que se muestre bajo el campo.
 */
export function montoDentroDelTotal(limite: () => number | null) {
  return (control: AbstractControl) => {
    const maximo = limite();
    const monto = Number(control.value);

    if (maximo === null || Number.isNaN(monto)) {
      return null;
    }

    if (monto > maximo) {
      return {
        excedeTotal: {
          mensaje: `No puede ser mayor que S/ ${maximo.toFixed(2)}; el resto de la atención ya está cubierto`,
        },
      };
    }

    return null;
  };
}