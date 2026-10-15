import { Component, ElementRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, NavController } from '@ionic/angular';
import { animate, stagger } from 'animejs';

import { Dispositivo } from '../data/modelos';
import { EscaneoService } from '../services/escaneo.service';
import { ObservacionesService } from '../services/observaciones.service';
import { describirUuid } from '../utils/gatt';
import { NivelSenal, barrasEncendidas, formatoRssi, hace, nivelSenal, nombreVisible } from '../utils/senal';

interface VistaDetalle {
  d: Dispositivo;
  nombre: string;
  nivel: NivelSenal;
  barras: boolean[];
  rssiTexto: string;
  visto: string;
  servicios: { corto: string; nombre: string }[];
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
        barras: barrasEncendidas(d.rssi),
        rssiTexto: formatoRssi(d.rssi),
        visto: hace(d.visto),
        servicios: d.uuids.map(describirUuid),
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
    } catch {
      this.mostrarAviso('No se pudo guardar. Revisa la conexión con el servidor.', 'error');
    } finally {
      this.guardando = false;
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
