import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { Sucursal } from '../../../core/models/catalogo.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import {
  Atencion,
  AtencionesService,
  DatosSesion,
  ETIQUETAS_ESTADO_ATENCION,
  ETIQUETAS_ESTADO_SESION,
  EstadoSesion,
  Sesion,
} from '../../../core/services/atenciones.service';
import { SesionModalComponent } from '../../../shared/componentes/sesion-modal/sesion-modal.component';
import { campoInvalido, mensajeDeError } from '../../../shared/formularios/validacion';

interface Odontologo {
  id: number;
  nombreCompleto: string;
  especialidad: string | null;
}

@Component({
  selector: 'app-atencion-detalle',
  imports: [ReactiveFormsModule, RouterLink, SesionModalComponent],
  templateUrl: './atencion-detalle.component.html',
  styleUrl: './atencion-detalle.component.scss',
})
export class AtencionDetalleComponent implements OnInit {
  private readonly atenciones = inject(AtencionesService);
  private readonly catalogos = inject(CatalogosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;
  protected readonly etiquetasEstadoAtencion = ETIQUETAS_ESTADO_ATENCION;
  protected readonly etiquetasEstadoSesion = ETIQUETAS_ESTADO_SESION;
  protected readonly usuario = this.auth.obtenerUsuario();

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly atencion = signal<Atencion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly odontologos = signal<Odontologo[]>([]);

  protected readonly formSesionVisible = signal(false);
  protected readonly sesionSeleccionada = signal<Sesion | null>(null);
  protected readonly fechaSesionSugerida = signal<string | null>(null);

  constructor() {
    effect(() => {
      const editable = this.editable();
      const controles = [
        this.formularioAtencion.controls.descripcion,
        this.formularioAtencion.controls.costo,
        this.formularioAtencion.controls.descuento,
      ];
      for (const control of controles) {
        if (editable && control.disabled) {
          control.enable({ emitEvent: false });
        } else if (!editable && control.enabled) {
          control.disable({ emitEvent: false });
        }
      }
    });
  }

  /**
   * Bajar el costo o subir el descuento no puede dejar el total por debajo de
   * lo que ya cargan las sesiones: la deuda quedaría negativa.
   */
  private readonly totalCubreSesiones = (grupo: AbstractControl): ValidationErrors | null => {
    const costo = Number(grupo.get('costo')?.value ?? 0);
    const descuento = Number(grupo.get('descuento')?.value ?? 0);
    const pagado = this.atencion()?.resumen.pagado ?? 0;
    const total = costo - descuento;

    if (total < pagado) {
      return {
        excedeTotal: {
          mensaje: `El total (S/ ${total.toFixed(
            2
          )}) no puede ser menor que lo ya cobrado en las sesiones (S/ ${pagado.toFixed(2)})`,
        },
      };
    }

    return null;
  };

  protected readonly formularioAtencion = new FormGroup(
    {
      descripcion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
      costo: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      descuento: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
    },
    { validators: [this.totalCubreSesiones] }
  );

  /** Mensaje del total de la atención, que se muestra bajo el costo. */
  protected errorTotal(): string | null {
    const error = this.formularioAtencion.errors?.['excedeTotal'];
    return error ? error.mensaje : null;
  }

  ngOnInit(): void {
    this.catalogos.listarSucursales().subscribe({
      next: (sucursales) => this.sucursales.set(sucursales),
      error: () => this.sucursales.set([]),
    });
    this.usuariosService.listarOdontologos().subscribe({
      next: (odontologos) => this.odontologos.set(odontologos),
      error: () => this.odontologos.set([]),
    });
    this.cargar();
  }

  protected editable(): boolean {
    const estado = this.atencion()?.estado;
    return estado === 'borrador' || estado === 'activo';
  }

  protected puedeAnular(): boolean {
    return this.usuario?.perfil === 'administrador' && this.atencion()?.estado !== 'anulado';
  }

  protected sesionesProgramadas(): number {
    return (this.atencion()?.sesiones ?? []).filter((sesion) => sesion.estado === 'programado').length;
  }

  /**
   * Cuánto puede llevar una sesión sin dejar la deuda en negativo: lo que
   * falta por cobrar, descontando lo que ya cargan las demás sesiones.
   */
  protected limiteDeSesion(sesion: Sesion | null): number | null {
    const atencion = this.atencion();
    if (!atencion) {
      return null;
    }

    const montoPropio = sesion?.monto ?? 0;
    const otrasSesiones = atencion.resumen.pagado - montoPropio;
    return this.redondear(atencion.costo - atencion.descuento - otrasSesiones);
  }

  protected guardarBorrador(): void {
    const atencion = this.atencion();
    if (!atencion) {
      return;
    }
    this.formularioAtencion.markAllAsTouched();
    if (this.formularioAtencion.invalid || this.procesando()) {
      return;
    }

    const valores = this.formularioAtencion.getRawValue();
    if (valores.descuento > valores.costo) {
      Swal.fire({
        icon: 'error',
        title: 'Revisa los montos',
        text: 'El descuento no puede ser mayor que el costo',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.procesando.set(true);
    this.atenciones
      .guardarBorrador(atencion.id, {
        idPaciente: atencion.idPaciente,
        idSucursal: atencion.idSucursal,
        idUsuario: atencion.idUsuario,
        fecha: atencion.fecha,
        hora: atencion.hora,
        descripcion: valores.descripcion.trim() || null,
        costo: valores.costo,
        descuento: valores.descuento,
      })
      .subscribe({
        next: (actualizada) => {
          this.procesando.set(false);
          this.atencion.set(actualizada);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Borrador guardado',
            showConfirmButton: false,
            timer: 1600,
          });
        },
        error: (error: unknown) => {
          this.procesando.set(false);
          this.mostrarError(errorApi(error).mensaje);
        },
      });
  }

  protected finalizar(): void {
    Swal.fire({
      icon: 'question',
      title: '¿Finalizar la atención?',
      text: 'La atención quedará cerrada y no admitirá más cambios.',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
    }).then((resultado) => {
      if (resultado.isConfirmed && this.atencion()) {
        this.aplicarEstado(this.atenciones.finalizar(this.atencion()!.id), 'Atención finalizada');
      }
    });
  }

  protected anular(): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Anular la atención?',
      text: 'La atención quedará anulada y no admitirá cambios.',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
    }).then((resultado) => {
      if (resultado.isConfirmed && this.atencion()) {
        this.aplicarEstado(this.atenciones.anular(this.atencion()!.id), 'Atención anulada');
      }
    });
  }

  protected nuevaSesion(): void {
    this.sesionSeleccionada.set(null);
    this.fechaSesionSugerida.set(this.proximaFechaSugerida());
    this.formSesionVisible.set(true);
  }

  protected editarSesion(sesion: Sesion): void {
    this.sesionSeleccionada.set(sesion);
    this.formSesionVisible.set(true);
  }

  protected cerrarFormSesion(): void {
    this.formSesionVisible.set(false);
    this.sesionSeleccionada.set(null);
  }

  protected guardarSesion(datos: DatosSesion): void {
    const atencion = this.atencion();
    if (!atencion) {
      return;
    }

    const sesion = this.sesionSeleccionada();
    const peticion =
      sesion === null
        ? this.atenciones.crearSesion(atencion.id, datos)
        : this.atenciones.actualizarSesion(sesion.id, datos);

    this.procesando.set(true);
    peticion.subscribe({
      next: () => {
        this.procesando.set(false);
        this.atenciones.notificarCalendario();
        this.cerrarFormSesion();
        this.cargar();
      },
      error: (error: unknown) => {
        this.procesando.set(false);
        this.mostrarError(errorApi(error).mensaje);
      },
    });
  }

  /**
   * Al atender se cierra el monto de la sesion: la ventana muestra el valor
   * actual para que se corrija si el odontologo lo cambia.
   */
  protected atender(sesion: Sesion): void {
    const formulario = this.camposAtenderSesion(sesion);
    const limite = this.limiteDeSesion(sesion);

    Swal.fire({
      icon: 'question',
      title: `¿Atender la sesión ${sesion.numero}?`,
      html: formulario.nodo,
      showCancelButton: true,
      confirmButtonText: 'Atender',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const monto = formulario.monto.value.trim();

        if (monto === '' || !Number.isFinite(Number(monto)) || Number(monto) < 0) {
          Swal.showValidationMessage('El monto debe ser un número mayor o igual a cero');
          return false;
        }

        if (limite !== null && Number(monto) > limite) {
          Swal.showValidationMessage(
            `No puede ser mayor que S/ ${limite.toFixed(2)}; el resto de la atención ya está cubierto`
          );
          return false;
        }

        return {
          monto: Number(monto),
          observaciones: formulario.observaciones.value.trim(),
        };
      },
    }).then((resultado) => {
      if (!resultado.isConfirmed) {
        return;
      }

      const datos = resultado.value as { monto: number; observaciones: string };
      this.aplicarCambioEnSesion(
        this.atenciones.atenderSesion(sesion.id, {
          monto: datos.monto,
          observaciones: datos.observaciones === '' ? null : datos.observaciones,
        }),
        `Sesión ${sesion.numero} atendida`
      );
    });
  }

  /**
   * Los campos se crean como elementos del DOM y no como texto: las
   * observaciones pueden traer HTML y no deben interpretarse.
   */
  private camposAtenderSesion(sesion: Sesion): {
    nodo: HTMLElement;
    monto: HTMLInputElement;
    observaciones: HTMLTextAreaElement;
  } {
    const nodo = document.createElement('div');

    const etiquetaMonto = document.createElement('label');
    etiquetaMonto.className = 'swal2-label';
    etiquetaMonto.textContent = 'Monto de la sesión (S/)';

    const monto = document.createElement('input');
    monto.type = 'number';
    monto.className = 'swal2-input';
    monto.min = '0';
    monto.step = '0.01';
    monto.value = String(sesion.monto);

    const etiquetaObservaciones = document.createElement('label');
    etiquetaObservaciones.className = 'swal2-label';
    etiquetaObservaciones.textContent = 'Observaciones de la sesión';

    const observaciones = document.createElement('textarea');
    observaciones.className = 'swal2-textarea';
    observaciones.placeholder = 'Opcional';
    observaciones.value = sesion.observaciones ?? '';

    nodo.append(etiquetaMonto, monto, etiquetaObservaciones, observaciones);
    return { nodo, monto, observaciones };
  }

  protected cancelarSesion(sesion: Sesion): void {
    Swal.fire({
      icon: 'warning',
      title: `¿Cancelar la sesión ${sesion.numero}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        this.aplicarCambioEnSesion(
          this.atenciones.cancelarSesion(sesion.id),
          `Sesión ${sesion.numero} cancelada`
        );
      }
    });
  }

  protected eliminarSesion(sesion: Sesion): void {
    Swal.fire({
      icon: 'warning',
      title: `¿Eliminar la sesión ${sesion.numero}?`,
      text: 'Se borrará definitivamente, incluso si ya fue atendida.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Volver',
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        this.procesando.set(true);
        this.atenciones.eliminarSesion(sesion.id).subscribe({
          next: () => {
            this.procesando.set(false);
            this.atenciones.notificarCalendario();
            this.cargar();
          },
          error: (error: unknown) => {
            this.procesando.set(false);
            this.mostrarError(errorApi(error).mensaje);
          },
        });
      }
    });
  }

  protected claseEstadoSesion(estado: EstadoSesion): string {
    return `estado-${estado}`;
  }

  protected monto(moneda: number): string {
    return `S/ ${moneda.toFixed(2)}`;
  }

  protected fechaLegible(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected horaLegible(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  /** Convierte "14:30" en "2:30 PM" para mostrar la hora de la cita. */
  protected horaCitaLegible(hora: string): string {
    const [horas, minutos] = hora.split(':').map(Number);
    const hora12 = horas % 12 === 0 ? 12 : horas % 12;
    const sufijo = horas < 12 ? 'AM' : 'PM';
    return `${hora12}:${String(minutos).padStart(2, '0')} ${sufijo}`;
  }

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  private proximaFechaSugerida(): string {
    const sesiones = this.atencion()?.sesiones ?? [];
    const base = sesiones.length > 0 ? new Date(sesiones[sesiones.length - 1].fechaHora) : new Date();
    base.setDate(base.getDate() + 7);
    return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(
      base.getDate()
    ).padStart(2, '0')}`;
  }

  private aplicarEstado(peticion: Observable<Atencion>, mensaje: string): void {
    this.procesando.set(true);
    peticion.subscribe({
      next: (atencion) => {
        this.procesando.set(false);
        this.atencion.set(atencion);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: mensaje,
          showConfirmButton: false,
          timer: 1800,
        });
      },
      error: (error: unknown) => {
        this.procesando.set(false);
        this.mostrarError(errorApi(error).mensaje);
      },
    });
  }

  private aplicarCambioEnSesion(peticion: Observable<Sesion>, mensaje: string): void {
    this.procesando.set(true);
    peticion.subscribe({
      next: () => {
        this.procesando.set(false);
        this.atenciones.notificarCalendario();
        this.cargar();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: mensaje,
          showConfirmButton: false,
          timer: 1800,
        });
      },
      error: (error: unknown) => {
        this.procesando.set(false);
        this.mostrarError(errorApi(error).mensaje);
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.atenciones.obtener(this.id).subscribe({
      next: (atencion) => {
        this.atencion.set(atencion);
        this.formularioAtencion.reset({
          descripcion: atencion.descripcion ?? '',
          costo: atencion.costo,
          descuento: atencion.descuento,
        });
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.mostrarError(errorApi(error).mensaje);
      },
    });
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'No se pudo completar la acción',
      text: mensaje,
      confirmButtonText: 'Entendido',
    });
  }

  /** Los centavos se ajustan para no arrastrar errores de coma flotante. */
  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }
}