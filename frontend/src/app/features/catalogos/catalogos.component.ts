import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { errorApi } from '../../core/http/error-api';
import { EntradaCatalogo, ItemCatalogo, Sucursal } from '../../core/models/catalogo.model';
import { CatalogosService } from '../../core/services/catalogos.service';
import { campoInvalido, mensajeDeError } from '../../shared/formularios/validacion';

type Pestana = 'sucursales' | 'procedencias';
type FiltroEstado = '' | 'true' | 'false';

@Component({
  selector: 'app-catalogos',
  imports: [ReactiveFormsModule],
  templateUrl: './catalogos.component.html',
  styleUrl: './catalogos.component.scss',
})
export class CatalogosComponent implements OnInit {
  private readonly catalogos = inject(CatalogosService);

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;

  protected readonly pestana = signal<Pestana>('sucursales');
  protected readonly filtroEstado = signal<FiltroEstado>('');
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly editandoId = signal<number | null>(null);

  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly procedencias = signal<ItemCatalogo[]>([]);

  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30)],
    }),
    direccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cambiarPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    this.cancelarEdicion();
  }

  protected itemsVisibles(): ItemCatalogo[] {
    const items = this.pestana() === 'sucursales' ? this.sucursales() : this.procedencias();
    const filtro = this.filtroEstado();
    if (filtro === '') {
      return items;
    }
    return items.filter((item) => item.activo === (filtro === 'true'));
  }

  protected direccionDe(item: ItemCatalogo): string {
    const sucursal = this.sucursales().find((candidata) => candidata.id === item.id);
    return sucursal?.direccion ?? '';
  }

  protected editar(item: ItemCatalogo): void {
    this.editandoId.set(item.id);
    this.formulario.setValue({
      nombre: item.nombre,
      direccion: this.pestana() === 'sucursales' ? this.direccionDe(item) : '',
    });
    document.getElementById('formulario-catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.formulario.reset({ nombre: '', direccion: '' });
  }

  protected estaEditando(item: ItemCatalogo): boolean {
    return this.editandoId() === item.id;
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.guardando()) {
      return;
    }

    const datos: EntradaCatalogo = {
      nombre: this.formulario.controls.nombre.value.trim(),
      direccion: this.formulario.controls.direccion.value.trim() || null,
    };

    this.guardando.set(true);
    const idEditando = this.editandoId();
    const peticion =
      idEditando === null ? this.crear(datos) : this.actualizar(idEditando, datos);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelarEdicion();
        this.cargar();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  protected alternarEstado(item: ItemCatalogo): void {
    if (item.activo) {
      Swal.fire({
        icon: 'warning',
        title: '¿Desactivar?',
        text: `"${item.nombre}" dejará de aparecer en los formularios.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
      }).then((resultado) => {
        if (resultado.isConfirmed) {
          this.aplicarEstado(item, false);
        }
      });
      return;
    }
    this.aplicarEstado(item, true);
  }

  protected accionPendiente(id: number): boolean {
    return this.editandoId() === id || this.guardando();
  }

  private crear(datos: EntradaCatalogo) {
    return this.pestana() === 'sucursales'
      ? this.catalogos.crearSucursal(datos)
      : this.catalogos.crearProcedencia(datos);
  }

  private actualizar(id: number, datos: EntradaCatalogo) {
    return this.pestana() === 'sucursales'
      ? this.catalogos.actualizarSucursal(id, datos)
      : this.catalogos.actualizarProcedencia(id, datos);
  }

  private aplicarEstado(item: ItemCatalogo, activo: boolean): void {
    const peticion =
      this.pestana() === 'sucursales'
        ? this.catalogos.cambiarEstadoSucursal(item.id, activo)
        : this.catalogos.cambiarEstadoProcedencia(item.id, activo);

    peticion.subscribe({
      next: () => {
        this.cargar();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: activo ? 'Registro activado' : 'Registro desactivado',
          showConfirmButton: false,
          timer: 1800,
        });
      },
      error: (error: unknown) => {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo cambiar el estado',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.catalogos.listarSucursales(false).subscribe({
      next: (sucursales) => {
        this.sucursales.set(sucursales);
        this.cargarProcedencias();
      },
      error: (error: unknown) => this.finCargaConError(errorApi(error).mensaje),
    });
  }

  private cargarProcedencias(): void {
    this.catalogos.listarProcedencias(false).subscribe({
      next: (procedencias) => {
        this.procedencias.set(procedencias);
        this.cargando.set(false);
      },
      error: (error: unknown) => this.finCargaConError(errorApi(error).mensaje),
    });
  }

  private finCargaConError(mensaje: string): void {
    this.cargando.set(false);
    Swal.fire({ icon: 'error', title: 'No se pudieron cargar los catálogos', text: mensaje, confirmButtonText: 'Entendido' });
  }
}
