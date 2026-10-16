import { Injectable, NgZone, inject } from '@angular/core';
import { BleClient, type BleService, type ScanResult } from '@capacitor-community/bluetooth-le';
import { BehaviorSubject } from 'rxjs';
import { Dispositivo } from '../data/modelos';

export interface LecturaGATT {
  servicio: string;
  caracteristica: string;
  valor?: string;
  error?: string;
}

/** Punto único de acceso a las operaciones BLE de la aplicación. */
@Injectable({ providedIn: 'root' })
export class EscaneoService {
  private readonly zona = inject(NgZone);
  private readonly mapa = new Map<string, Dispositivo>();
  private inicializando?: Promise<void>;
  private escaneoIniciado = false;

  readonly dispositivos$ = new BehaviorSubject<Dispositivo[]>([]);
  private readonly estadoBluetoothSubject = new BehaviorSubject<boolean | null>(true);
  readonly estadoBluetooth$ = this.estadoBluetoothSubject.asObservable();
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  escaneando = false;

  get bluetoothActivo(): boolean | null {
    return this.estadoBluetoothSubject.value;
  }

  /** Inicializa BLE y solicita los permisos nativos requeridos. */
  async solicitarPermisos(): Promise<boolean> {
    await this.inicializar();
    const activo = await BleClient.isEnabled();
    this.publicarEstadoBluetooth(activo);
    return activo;
  }

  async iniciar(): Promise<void> {
    if (this.escaneando) return;
    this.errorSubject.next(null);

    try {
      await this.inicializar();
      let activo = await BleClient.isEnabled();
      if (!activo) {
        try {
          await BleClient.requestEnable();
          activo = await BleClient.isEnabled();
        } catch {
          // Si el usuario cancela la activación
        }
      }
      this.publicarEstadoBluetooth(activo);

      if (!activo) {
        throw new Error('Bluetooth está apagado. Actívalo para iniciar el escaneo.');
      }

      this.mapa.clear();
      this.publicar();

      await BleClient.requestLEScan(
        { allowDuplicates: true },
        (resultado) => this.procesarResultado(resultado)
      );

      this.escaneoIniciado = true;
      this.escaneando = true;
    } catch (error) {
      this.escaneoIniciado = false;
      this.escaneando = false;
      this.publicarError(error, 'No se pudo iniciar el escaneo BLE');
      throw error;
    }
  }

  async detener(): Promise<void> {
    const estabaEscaneando = this.escaneoIniciado;
    this.escaneando = false;
    this.escaneoIniciado = false;
    if (!estabaEscaneando) return;

    try {
      await BleClient.stopLEScan();
    } catch (error) {
      this.publicarError(error, 'No se pudo detener el escaneo BLE');
      throw error;
    }
  }

  obtener(id: string): Dispositivo | undefined {
    return this.mapa.get(id);
  }

  /** Conecta con el periférico y lee sus características GATT legibles. */
  async conectarYLeer(id: string): Promise<LecturaGATT[]> {
    await this.inicializar();
    const activo = await BleClient.isEnabled();
    this.publicarEstadoBluetooth(activo);
    if (!activo) throw new Error('Bluetooth está apagado. Actívalo antes de conectar.');

    const reanudarEscaneo = this.escaneando;
    if (reanudarEscaneo) await this.detener();

    let conectado = false;
    let fallo: unknown;
    let lecturas: LecturaGATT[] = [];

    try {
      await BleClient.connect(id);
      conectado = true;
      const servicios = await BleClient.getServices(id);
      lecturas = await this.leerCaracteristicas(id, servicios);
    } catch (error) {
      fallo = error;
    }

    if (conectado) {
      try {
        await BleClient.disconnect(id);
      } catch (error) {
        fallo ??= error;
      }
    }

    if (reanudarEscaneo && (await BleClient.isEnabled())) {
      try {
        await this.iniciar();
      } catch (error) {
        fallo ??= error;
      }
    }

    if (fallo !== undefined) {
      this.publicarError(fallo, 'No se pudieron consultar los datos del dispositivo');
      throw fallo;
    }
    return lecturas;
  }

  private async inicializar(): Promise<void> {
    if (!this.inicializando) {
      this.inicializando = (async () => {
        // CORREGIDO: androidNeverForLocation en true para que coincida con tu AndroidManifest.xml
        await BleClient.initialize({ androidNeverForLocation: true });

        await BleClient.startEnabledNotifications((activo) => {
          this.zona.run(() => this.publicarEstadoBluetooth(activo));
          if (!activo && this.escaneoIniciado) {
            void this.detener().catch((error: unknown) =>
              this.publicarError(error, 'Bluetooth se apagó durante el escaneo')
            );
          }
        });

        const inicial = await BleClient.isEnabled();
        this.zona.run(() => this.publicarEstadoBluetooth(inicial));
      })().catch((error: unknown) => {
        this.inicializando = undefined;
        throw error;
      });
    }
    await this.inicializando;
  }

  private procesarResultado(resultado: ScanResult): void {
    if (resultado.rssi === undefined) return;
    const ahora = Date.now();
    const idsFabricante = resultado.manufacturerData ? Object.keys(resultado.manufacturerData) : [];
    const dispositivo: Dispositivo = {
      id: resultado.device.deviceId,
      nombre: resultado.localName ?? resultado.device.name ?? null,
      rssi: resultado.rssi,
      fabricante: idsFabricante.length ? idsFabricante.map((id) => `ID ${id}`).join(', ') : null,
      conectable: true,
      uuids: resultado.uuids ?? resultado.device.uuids ?? [],
      visto: ahora,
    };

    this.zona.run(() => {
      this.mapa.set(dispositivo.id, dispositivo);
      for (const [id, detectado] of this.mapa) {
        if (ahora - detectado.visto > 15_000) this.mapa.delete(id);
      }
      this.publicar();
    });
  }

  private async leerCaracteristicas(id: string, servicios: BleService[]): Promise<LecturaGATT[]> {
    const lecturas: LecturaGATT[] = [];
    for (const servicio of servicios) {
      for (const caracteristica of servicio.characteristics) {
        if (!caracteristica.properties.read) continue;
        try {
          const valor = await BleClient.read(id, servicio.uuid, caracteristica.uuid);
          lecturas.push({
            servicio: servicio.uuid,
            caracteristica: caracteristica.uuid,
            valor: this.formatearBytes(valor),
          });
        } catch (error) {
          lecturas.push({
            servicio: servicio.uuid,
            caracteristica: caracteristica.uuid,
            error: this.mensajeError(error),
          });
        }
      }
    }
    return lecturas;
  }

  private formatearBytes(valor: DataView): string {
    if (!valor.byteLength) return '(sin datos)';
    return Array.from({ length: valor.byteLength }, (_, indice) =>
      valor.getUint8(indice).toString(16).padStart(2, '0').toUpperCase(),
    ).join(' ');
  }

  registrar(dispositivo: Dispositivo): void {
    this.mapa.set(dispositivo.id, dispositivo);
    this.publicar();
  }

  private publicar(): void {
    const lista = [...this.mapa.values()];
    this.zona.run(() => this.dispositivos$.next(lista));
  }

  private publicarEstadoBluetooth(activo: boolean): void {
    this.estadoBluetoothSubject.next(activo);
    if (!activo) {
      this.mapa.clear();
      this.publicar();
    }
  }

  private publicarError(error: unknown, contexto: string): void {
    this.errorSubject.next(`${contexto}: ${this.mensajeError(error)}`);
  }

  private mensajeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}