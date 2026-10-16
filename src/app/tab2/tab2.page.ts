import { Component, ElementRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { animate, stagger } from 'animejs';

import { Observacion, RangoHistorial } from '../data/modelos';
import { ObservacionesService } from '../services/observaciones.service';
import { NivelSenal, etiquetaDia, formatoRssi, horaCorta, nivelSenal, nombreVisible } from '../utils/senal';

interface FilaHistorial {
  obs: Observacion;
  hora: string;
  nombre: string;
  rssiTexto: string;
  nivel: NivelSenal;
}
interface GrupoDia {
  etiqueta: string;
  items: FilaHistorial[];
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [CommonModule, IonContent],
})
export class Tab2Page {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zona = inject(NgZone);
  private observaciones = inject(ObservacionesService);

  readonly rangos: { valor: RangoHistorial; texto: string }[] = [
    { valor: 'hoy', texto: 'Hoy' },
    { valor: 'semana', texto: 'Semana' },
    { valor: 'todos', texto: 'Todos' },
  ];

  rango: RangoHistorial = 'hoy';
  texto = '';
  cargando = false;
  error = '';
  total = 0;
  grupos: GrupoDia[] = [];

  private pedido = 0; // evita que una respuesta lenta pise a una más reciente
  private espera?: ReturnType<typeof setTimeout>;

  /** Cada vez que se entra a la pestaña se recarga (por si se guardó algo nuevo en Detalle). */
  ionViewWillEnter() {
    this.cargar();
  }

  cambiarRango(r: RangoHistorial) {
    this.rango = r;
    this.cargar();
  }

  buscar(e: Event) {
    this.texto = (e.target as HTMLInputElement).value;
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cargar(), 250);
  }

  async cargar() {
    const mio = ++this.pedido;
    this.cargando = true;
    this.error = '';
    try {
      const lista = await this.observaciones.listar(this.rango, this.texto);
      if (mio !== this.pedido) return;
      this.total = lista.length;
      this.grupos = this.agrupar(lista);
    } catch (error) {
      if (mio !== this.pedido) return;
      this.total = 0;
      this.grupos = [];
      this.error = error instanceof Error
        ? `No se pudo cargar el historial: ${error.message}`
        : 'No se pudo cargar el historial.';
    } finally {
      if (mio === this.pedido) this.cargando = false;
    }
    setTimeout(() => this.animarFilas());
  }

  private agrupar(lista: Observacion[]): GrupoDia[] {
    const ordenadas = [...lista].sort((a, b) => b.visto.localeCompare(a.visto));
    const grupos: GrupoDia[] = [];
    for (const o of ordenadas) {
      const etiqueta = etiquetaDia(o.visto);
      let g = grupos.find((x) => x.etiqueta === etiqueta);
      if (!g) grupos.push((g = { etiqueta, items: [] }));
      g.items.push({
        obs: o,
        hora: horaCorta(o.visto),
        nombre: nombreVisible(o.nombre),
        rssiTexto: o.rssi === null ? '—' : formatoRssi(o.rssi),
        nivel: nivelSenal(o.rssi ?? -100),
      });
    }
    return grupos;
  }

  /** Las filas entran escalonadas (anime.js). */
  private animarFilas() {
    const filas = this.host.nativeElement.querySelectorAll('.history-item');
    if (!filas.length) return;
    this.zona.runOutsideAngular(() => {
      animate(filas, { opacity: [0, 1], translateY: [10, 0], delay: stagger(40), duration: 350, ease: 'outQuad' });
    });
  }
}
