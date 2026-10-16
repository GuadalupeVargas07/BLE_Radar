import { Component, ElementRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, NavController } from '@ionic/angular';
import { animate, stagger } from 'animejs';

import { Dispositivo } from '../data/modelos';
import { EscaneoService, LecturaGATT } from '../services/escaneo.service';
import { ObservacionesService } from '../services/observaciones.service';
import { describirUuid } from '../utils/gatt';
import { DistanciaAproximada, NivelSenal, barrasEncendidas, distanciaAproximada, formatoRssi, hace, nivelSenal, nombreVisible } from '../utils/senal';

interface VistaDetalle {
  d: Dispositivo;
  nombre: string;
  nivel: NivelSenal;
  distancia: DistanciaAproximada;
  barras: boolean[];
  rssiTexto: string;
  visto: string;
  servicios: { corto: string; nombre: string }[];
  lecturas: LecturaGATT[];
}

@Component({
  selector: 'app-detalle',
  templateUrl: 'detalle.page.html',
  styleUrls: ['detalle.page.scss'],
  imports: [CommonModule, IonContent],
})
export class DetallePage {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zona = inject(NgZone);
  private ruta = inject(ActivatedRoute);
  private nav = inject(NavController);
  private escaneo = inject(EscaneoService);
  private observaciones = inject(ObservacionesService);

  vista?: VistaDetalle;
  guardando = false;
  leyendo = false;
  lecturaRealizada = false;
  errorLectura = '';
  readonly describirUuid = describirUuid;
  aviso?: { texto: string; tipo: 'ok' | 'error' };

  private cierreAviso?: ReturnType<typeof setTimeout>;

  constructor() {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';
    const d = this.escaneo.obtener(id);
    if (d) {
      this.vista = {
        d,
        nombre: nombreVisible(d.nombre),
        nivel: nivelSenal(d.rssi),
        distancia: distanciaAproximada(d.rssi),
        barras: barrasEncendidas(d.rssi),
        rssiTexto: formatoRssi(d.rssi),
        visto: hace(d.visto),
        servicios: d.uuids.map(describirUuid),
        lecturas: [],
      };
    }
  }

  ionViewDidEnter() {
    const bloques = this.host.nativeElement.querySelectorAll('.card, .tile, .service');
    if (!bloques.length) return;
    this.zona.runOutsideAngular(() => {
      animate(bloques, { opacity: [0, 1], translateY: [12, 0], delay: stagger(45), duration: 380, ease: 'outQuad' });
    });
  }

  volver() {
    this.nav.navigateBack('/tabs/tab1');
  }

  async guardar() {
    if (!this.vista || this.guardando) return;
    this.guardando = true;
    try {
      await this.observaciones.guardar(this.vista.d);
      this.mostrarAviso('Observación guardada', 'ok');
    } catch (error) {
      console.error('No se pudo guardar la observación en la API:', error);
      const detalle = error instanceof Error ? ` ${error.message}` : '';
      this.mostrarAviso(`No se pudo guardar la observación.${detalle}`, 'error');
    } finally {
      this.guardando = false;
    }
  }

  async conectarYLeer() {
    if (!this.vista || this.leyendo) return;
    this.leyendo = true;
    this.errorLectura = '';
    this.lecturaRealizada = false;
    this.vista.lecturas = [];
    try {
      this.vista.lecturas = await this.escaneo.conectarYLeer(this.vista.d.id);
      this.lecturaRealizada = true;
    } catch (error) {
      this.errorLectura = error instanceof Error ? error.message : String(error);
    } finally {
      this.leyendo = false;
    }
  }

  private mostrarAviso(texto: string, tipo: 'ok' | 'error') {
    this.aviso = { texto, tipo };
    clearTimeout(this.cierreAviso);
    setTimeout(() => {
      const toast = this.host.nativeElement.querySelector('.toast');
      if (toast) this.zona.runOutsideAngular(() => animate(toast, { opacity: [0, 1], translateY: [20, 0], duration: 300, ease: 'outCubic' }));
    });
    this.cierreAviso = setTimeout(() => (this.aviso = undefined), 2600);
  }
}
