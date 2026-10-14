import { Component, computed, effect, input, output, signal } from '@angular/core';

const HORA_INICIO = 7 * 60;
const HORA_FIN = 20 * 60;
const INTERVALO_MINUTOS = 30;

interface OpcionHorario {
  valor: string;
  etiqueta: string;
}

function aTexto(horas: number, minutos: number): string {
  const hora12 = horas % 12 === 0 ? 12 : horas % 12;
  const minuto = minutos === 0 ? '00' : String(minutos);
  const sufijo = horas < 12 ? 'AM' : 'PM';
  return `${hora12}:${minuto} ${sufijo}`;
}

@Component({
  selector: 'app-selector-horario',
  templateUrl: './selector-horario.component.html',
  styleUrl: './selector-horario.component.scss',
})
export class SelectorHorarioComponent {
  /** Hora seleccionada en formato HH:mm. */
  readonly horaSeleccionada = input<string | null>(null);
  readonly horarioElegido = output<string>();

  protected readonly seleccion = signal<string | null>(null);

  constructor() {
    effect(() => {
      const externa = this.horaSeleccionada();
      if (externa !== this.seleccion()) {
        this.seleccion.set(externa);
      }
    });
  }

  protected readonly manana = computed(() => this.generar(horas => horas < 12));
  protected readonly tarde = computed(() => this.generar(horas => horas >= 12));

  protected elegir(opcion: OpcionHorario): void {
    this.seleccion.set(opcion.valor);
    this.horarioElegido.emit(opcion.valor);
  }

  protected estaSeleccionada(valor: string): boolean {
    return this.seleccion() === valor;
  }

  private generar(esManana: (horas: number) => boolean): OpcionHorario[] {
    const opciones: OpcionHorario[] = [];
    for (let minutos = HORA_INICIO; minutos <= HORA_FIN; minutos += INTERVALO_MINUTOS) {
      const horas = Math.floor(minutos / 60);
      if (!esManana(horas)) {
        continue;
      }
      opciones.push({
        valor: `${String(horas).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`,
        etiqueta: aTexto(horas, minutos % 60),
      });
    }
    return opciones;
  }
}