import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Dispositivo } from '../data/modelos';
import { DISPOSITIVOS_EJEMPLO } from '../data/ejemplos';

/* =========================================================================
   ÚNICO punto de contacto con el plugin BLE (@capacitor-community/bluetooth-le).
   Las pantallas solo usan:
     · dispositivos$        → lista actual de dispositivos detectados
     · solicitarPermisos()  → permisos de Bluetooth / ubicación
     · iniciar() / detener()
     · obtener(id)          → un dispositivo por su id (para la pantalla Detalle)
   Hoy funciona con datos simulados (bloques "DEMO"). Para usar el plugin real:
     1) npm i @capacitor-community/bluetooth-le && npx cap sync
     2) en iniciar(): BleClient.initialize() y BleClient.requestLEScan(...),
        convertir cada resultado a Dispositivo y llamar a registrar()
     3) en detener(): BleClient.stopLEScan()
     4) borrar los bloques DEMO
   ========================================================================= */
@Injectable({ providedIn: 'root' })
export class EscaneoService {
  private zona = inject(NgZone);

  private mapa = new Map<string, Dispositivo>();
  private temporizador?: ReturnType<typeof setInterval>;

  /** Dispositivos detectados ahora mismo (se emite en cada actualización). */
  readonly dispositivos$ = new BehaviorSubject<Dispositivo[]>([]);
  escaneando = false;

  /** Pide permisos de Bluetooth y ubicación. Devuelve true si se concedieron. */
  async solicitarPermisos(): Promise<boolean> {
    // TODO(Jay/Yael): await BleClient.initialize({ androidNeverForLocation: false }); return await BleClient.isEnabled();
    return true; // DEMO
  }

  async iniciar(): Promise<void> {
    if (this.escaneando) return;
    this.escaneando = true;

    // TODO(Jay/Yael): BleClient.requestLEScan({ allowDuplicates: true }, (r) => this.registrar({...}));

    // DEMO ↓ (simula resultados de escaneo cada segundo)
    this.zona.runOutsideAngular(() => {
      this.simularTick();
      this.temporizador = setInterval(() => this.simularTick(), 1000);
    });
  }

  async detener(): Promise<void> {
    this.escaneando = false;
    // TODO(Jay/Yael): await BleClient.stopLEScan();
    clearInterval(this.temporizador); // DEMO
    this.temporizador = undefined;
  }

  obtener(id: string): Dispositivo | undefined {
    return this.mapa.get(id);
  }

  /** Alta o actualización de un dispositivo detectado. El plugin real debe llamar a esto con cada resultado. */
  registrar(d: Dispositivo): void {
    this.mapa.set(d.id, d);
    this.publicar();
  }

  private publicar(): void {
    const lista = [...this.mapa.values()];
    this.zona.run(() => this.dispositivos$.next(lista));
  }

  // ---------------------------------------------------------------- DEMO
  private simularTick(): void {
    const ahora = Date.now();
    for (const base of DISPOSITIVOS_EJEMPLO) {
      if (Math.random() < 0.12) continue; // a veces "no se escucha" a un dispositivo
      const rssi = Math.round(base.rssi + (Math.random() * 6 - 3));
      this.mapa.set(base.id, { ...base, rssi, visto: ahora });
    }
    // Quitar los que llevan más de 6 s sin verse
    for (const [id, d] of this.mapa) if (ahora - d.visto > 6000) this.mapa.delete(id);
    this.publicar();
  }
}
