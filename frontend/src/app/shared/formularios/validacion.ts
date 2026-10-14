import { AbstractControl } from '@angular/forms';

export function mensajeDeError(control: AbstractControl): string {
  const errores = control.errors ?? {};
  if (errores['required']) return 'Este campo es obligatorio';
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