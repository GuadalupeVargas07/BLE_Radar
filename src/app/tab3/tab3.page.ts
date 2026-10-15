import { Component, ElementRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { animate, stagger } from 'animejs';

import { Ajustes } from '../data/modelos';
import { AjustesService } from '../services/ajustes.service';
import { ObservacionesService } from '../services/observaciones.service';

type ClaveSwitch = 'guardadoAutomatico' | 'pantallaEncendida';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [CommonModule, IonContent],
})
export class Tab3Page {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zona = inject(NgZone);
  private servicio = inject(AjustesService);
  private observaciones = inject(ObservacionesService);

  readonly version = '1.0.0';

  ajustes: Ajustes = this.servicio.obtener();
  probando = false;
  ms: number | null = null;
  estado: { texto: string; clase: string } = { texto: 'Sin probar', clase: 'dot--idle' };

  ionViewDidEnter() {
    this.ajustes = this.servicio.obtener();
    const tarjetas = this.host.nativeElement.querySelectorAll('.card');
    this.zona.runOutsideAngular(() => {
      animate(tarjetas, { opacity: [0, 1], translateY: [14, 0], delay: stagger(70), duration: 400, ease: 'outQuad' });
    });
  }

  /** Switches: se guardan al instante en el dispositivo. */
  cambiarSwitch(clave: ClaveSwitch, e: Event) {
    const valor = (e.target as HTMLInputElement).checked;
    this.ajustes = { ...this.ajustes, [clave]: valor };
    this.servicio.cambiar(clave, valor);
  }

  cambiarUrl(e: Event) {
    const valor = (e.target as HTMLInputElement).value;
    this.ajustes = { ...this.ajustes, urlApi: valor };
    this.servicio.cambiar('urlApi', valor);
    this.estado = { texto: 'Sin probar', clase: 'dot--idle' };
    this.ms = null;
  }

  async probar() {
    this.probando = true;
    this.ms = null;
    try {
      this.ms = await this.observaciones.probarConexion(this.ajustes.urlApi);
      this.estado = { texto: 'Conectado al servidor', clase: '' };
    } catch (e) {
      this.estado = { texto: e instanceof Error ? e.message : 'No se pudo conectar', clase: 'dot--weak' };
    } finally {
      this.probando = false;
    }
  }
}
