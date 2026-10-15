import { Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { animate, stagger } from 'animejs';

import { Dispositivo, Filtros, FILTROS_POR_DEFECTO, RSSI_MIN } from '../data/modelos';
import { EscaneoService } from '../services/escaneo.service';
import { AjustesService } from '../services/ajustes.service';
import { ObservacionesService } from '../services/observaciones.service';
import { aplicarFiltros, contarFiltrosActivos } from '../utils/filtros';
import { DistanciaAproximada, NivelSenal, barrasEncendidas, distanciaAproximada, formatoRssi, nivelSenal, nombreVisible, posicionRadar, rellenoSlider } from '../utils/senal';

/** Lo que pinta la plantilla por cada dispositivo (ya calculado, para no recalcular en cada ciclo). */
interface Vista {
  d: Dispositivo;
  nombre: string;
  nivel: NivelSenal;
  distancia: DistanciaAproximada;
  barras: boolean[];
  rssiTexto: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule, RouterLink, IonContent],
})
export class Tab1Page implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zona = inject(NgZone);
  private escaneo = inject(EscaneoService);
  readonly estadoBluetooth$ = this.escaneo.estadoBluetooth$;
  readonly errorEscaneo$ = this.escaneo.error$;
  private ajustes = inject(AjustesService);
  private observaciones = inject(ObservacionesService);

  vistas: Vista[] = [];
  totalDetectados = 0;
  escaneando = false;

  filtros: Filtros = { ...FILTROS_POR_DEFECTO };
  borrador: Filtros = { ...FILTROS_POR_DEFECTO };
  filtroAbierto = false;

  private suscripcion?: Subscription;
  private conocidos = new Set<string>();
  private guardados = new Set<string>();
  private barrido?: ReturnType<typeof animate>;
  private pulso?: ReturnType<typeof animate>;

  readonly porId = (_: number, v: Vista) => v.d.id;
  readonly relleno = rellenoSlider;

  get filtrosActivos(): number {
    return contarFiltrosActivos(this.filtros);
  }

  get textoRssiMin(): string {
    return this.borrador.rssiMin <= RSSI_MIN ? 'Sin límite' : formatoRssi(this.borrador.rssiMin);
  }

  // ------------------------------------------------------------------ ciclo de vida de Ionic
  async ionViewDidEnter() {
    this.suscripcion ??= this.escaneo.dispositivos$.subscribe((lista) => this.actualizar(lista));
    this.iniciarAnimaciones();
    if (!this.escaneo.escaneando) {
      try {
        await this.escaneo.iniciar();
      } catch (error) {
        console.error('No se pudo iniciar el escaneo BLE:', error);
      }
    }
    this.escaneando = this.escaneo.escaneando;
    if (this.escaneando) this.reanudarAnimaciones();
  }

  ionViewWillLeave() {
    this.barrido?.pause();
    this.pulso?.pause();
  }

  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
    this.barrido?.pause();
    this.pulso?.pause();
  }

  // ------------------------------------------------------------------ acciones
  async alternarEscaneo() {
    try {
      if (this.escaneo.escaneando) {
        await this.escaneo.detener();
        this.barrido?.pause();
        this.pulso?.pause();
      } else {
        await this.escaneo.iniciar();
        this.reanudarAnimaciones();
      }
    } catch (error) {
      console.error('No se pudo cambiar el estado del escaneo BLE:', error);
    } finally {
      this.escaneando = this.escaneo.escaneando;
    }
  }

  limpiarFiltros() {
    this.filtros = { ...FILTROS_POR_DEFECTO };
    this.actualizar(this.escaneo.dispositivos$.value);
  }

  // ------------------------------------------------------------------ bottom sheet de filtros
  abrirFiltros() {
    this.borrador = { ...this.filtros };
    this.filtroAbierto = true;
    setTimeout(() => {
      const el = this.host.nativeElement;
      this.fuera(() => {
        animate(el.querySelector('.sheet__overlay')!, { opacity: [0, 1], duration: 250, ease: 'linear' });
        animate(el.querySelector('.sheet__panel')!, { translateY: ['100%', '0%'], duration: 350, ease: 'outCubic' });
      });
    });
  }

  cerrarFiltros() {
    const el = this.host.nativeElement;
    const panel = el.querySelector('.sheet__panel');
    if (!panel) return;
    this.fuera(() => {
      animate(el.querySelector('.sheet__overlay')!, { opacity: [1, 0], duration: 200, ease: 'linear' });
      animate(panel, {
        translateY: ['0%', '100%'],
        duration: 250,
        ease: 'inCubic',
        onComplete: () => this.zona.run(() => (this.filtroAbierto = false)),
      });
    });
  }

  confirmarFiltros() {
    this.filtros = { ...this.borrador };
    this.actualizar(this.escaneo.dispositivos$.value);
    this.cerrarFiltros();
  }

  limpiarBorrador() {
    this.borrador = { ...FILTROS_POR_DEFECTO };
  }

  cambiarRssi(e: Event) {
    this.borrador.rssiMin = Number((e.target as HTMLInputElement).value);
  }
  cambiarTexto(e: Event) {
    this.borrador.texto = (e.target as HTMLInputElement).value;
  }
  marcado(e: Event): boolean {
    return (e.target as HTMLInputElement).checked;
  }

  // ------------------------------------------------------------------ datos → vista
  private actualizar(lista: Dispositivo[]) {
    this.totalDetectados = lista.length;
    const visibles = aplicarFiltros(lista, this.filtros).sort((a, b) => b.rssi - a.rssi);

    this.vistas = visibles.map((d) => {
      const { x, y } = posicionRadar(d.id, d.rssi);
      return {
        d,
        nombre: nombreVisible(d.nombre),
        nivel: nivelSenal(d.rssi),
        distancia: distanciaAproximada(d.rssi),
        barras: barrasEncendidas(d.rssi),
        rssiTexto: formatoRssi(d.rssi),
        x,
        y,
      };
    });

    // Dispositivos que aparecen por primera vez → animación de entrada
    const nuevos = this.vistas.filter((v) => !this.conocidos.has(v.d.id)).map((v) => v.d.id);
    this.conocidos = new Set(this.vistas.map((v) => v.d.id));
    if (nuevos.length) setTimeout(() => this.animarEntrada(nuevos));

    // Guardado automático (Ajustes): una vez por dispositivo y sesión
    if (this.ajustes.obtener().guardadoAutomatico) {
      for (const d of visibles) {
        if (this.guardados.has(d.id)) continue;
        this.guardados.add(d.id);
        this.observaciones.guardar(d).catch(() => this.guardados.delete(d.id));
      }
    }
  }

  // ------------------------------------------------------------------ animaciones (anime.js)
  private iniciarAnimaciones() {
    if (this.barrido) return;
    const el = this.host.nativeElement;
    this.fuera(() => {
      // El barrido del radar gira sin parar mientras se escanea
      this.barrido = animate(el.querySelector('.radar__sweep')!, {
        rotate: 360,
        duration: 4000,
        ease: 'linear',
        loop: true,
      });
      // Latido del punto central
      this.pulso = animate(el.querySelector('.radar__me')!, {
        scale: [1, 1.3],
        opacity: [1, 0.7],
        duration: 1100,
        ease: 'inOutSine',
        loop: true,
        alternate: true,
      });
    });
  }

  private reanudarAnimaciones() {
    this.barrido?.resume();
    this.pulso?.resume();
  }

  /** Aparición escalonada de los puntos del radar y de las tarjetas nuevas. */
  private animarEntrada(ids: string[]) {
    const todos = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[data-id]'));
    const nuevos = todos.filter((e) => ids.includes(e.dataset['id'] ?? ''));
    const puntos = nuevos.filter((e) => e.classList.contains('radar__dot'));
    const tarjetas = nuevos.filter((e) => e.classList.contains('device'));
    this.fuera(() => {
      if (puntos.length) animate(puntos, { scale: [0, 1], opacity: [0, 1], delay: stagger(80), duration: 500, ease: 'outBack' });
      if (tarjetas.length) animate(tarjetas, { opacity: [0, 1], translateY: [12, 0], delay: stagger(60), duration: 400, ease: 'outQuad' });
    });
  }

  /** Corre fuera de la zona de Angular para que las animaciones no disparen detección de cambios en cada fotograma. */
  private fuera(fn: () => void) {
    this.zona.runOutsideAngular(fn);
  }
}
