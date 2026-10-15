import { Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { animate, stagger } from 'animejs';

import { EscaneoService } from '../services/escaneo.service';

@Component({
  selector: 'app-bienvenida',
  templateUrl: 'bienvenida.page.html',
  styleUrls: ['bienvenida.page.scss'],
  imports: [CommonModule, IonContent],
})
export class BienvenidaPage implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zona = inject(NgZone);
  private router = inject(Router);
  private escaneo = inject(EscaneoService);

  trabajando = false;
  error = '';

  private barrido?: ReturnType<typeof animate>;

  ionViewDidEnter() {
    const el = this.host.nativeElement;
    this.zona.runOutsideAngular(() => {
      this.barrido ??= animate(el.querySelector('.radar__sweep')!, { rotate: 360, duration: 4000, ease: 'linear', loop: true });
      animate(el.querySelectorAll('.permission'), { opacity: [0, 1], translateY: [16, 0], delay: stagger(120, { start: 250 }), duration: 450, ease: 'outQuad' });
      animate(el.querySelectorAll('.radar__dot'), { scale: [0, 1], delay: stagger(200, { start: 400 }), duration: 500, ease: 'outBack' });
    });
  }

  ngOnDestroy() {
    this.barrido?.pause();
  }

  async activar() {
    this.trabajando = true;
    this.error = '';
    try {
      const ok = await this.escaneo.solicitarPermisos();
      if (ok) await this.irAlRadar();
      else this.error = this.escaneo.bluetoothActivo === false
        ? 'Bluetooth está apagado. Actívalo en los ajustes rápidos del teléfono.'
        : 'Sin permisos no se puede escanear. Actívalos en los ajustes del teléfono.';
    } catch (error) {
      this.error = error instanceof Error ? `No se pudo inicializar Bluetooth: ${error.message}` : 'No se pudieron solicitar los permisos.';
    } finally {
      this.trabajando = false;
    }
  }

  async ahoraNo() {
    this.error = '';
    await this.irAlRadar();
  }

  /** Abre el Radar (pestaña 1). Si la ruta no existe o falla, lo dice en pantalla en vez de quedarse mudo. */
  private async irAlRadar() {
    try {
      const abrio = await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      if (!abrio) this.error = 'No se pudo abrir el Radar. Revisa que exista la ruta /tabs/tab1 en las rutas de la app.';
    } catch (e) {
      console.error('Bienvenida → Radar:', e);
      this.error = 'No se pudo abrir el Radar. Revisa la consola del navegador (F12).';
    }
  }
}