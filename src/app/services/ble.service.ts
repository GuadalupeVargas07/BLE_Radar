import { Injectable, NgZone } from '@angular/core';
import { BleClient, BleService as ServicioBleNativo, ScanResult } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

export interface DispositivoRadar {
  deviceId: string;
  nombre: string;
  rssi: number;
  txPower?: number;
  uuids: string[];
  fechaDeteccion: string;
  distanciaAprox?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BleService {
  dispositivos: DispositivoRadar[] = [];
  escaneando: boolean = false;

  constructor(private ngZone: NgZone) {}

  // 1. Inicializa el Bluetooth en Android
  async inicializar(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true; // En PC continúa en modo desarrollo
    }
    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      const activo = await BleClient.isEnabled();
      if (!activo) {
        await BleClient.requestEnable();
      }
      return true;
    } catch (error) {
      console.error('Error al inicializar Bluetooth nativo:', error);
      return false;
    }
  }

  // 2. Inicia el escaneo tipo Radar
  async iniciarRadar(): Promise<void> {
    const listo = await this.inicializar();
    if (!listo) return;

    this.dispositivos = [];
    this.escaneando = true;

    // Si están probando en Android físico: usa el hardware real
    if (Capacitor.isNativePlatform()) {
      try {
        await BleClient.requestLEScan(
          { allowDuplicates: true },
          (resultado: ScanResult) => {
            this.ngZone.run(() => {
              this.guardarOActualizar(resultado);
            });
          }
        );

        setTimeout(() => {
          if (this.escaneando) {
            this.detenerRadar();
          }
        }, 12000);
      } catch (error) {
        console.error('Error durante el escaneo BLE:', error);
        this.escaneando = false;
      }
    } else {
      // Si están en la PC (localhost): simula dispositivos para que Michel y Yael puedan probar pantallas y PHP
      setTimeout(() => {
        this.dispositivos = [
          { deviceId: 'E4:5F:01:22:AA:BB', nombre: 'Audífonos Bluetooth', rssi: -58, uuids: ['180A'], fechaDeteccion: new Date().toISOString(), distanciaAprox: 'Cerca' },
          { deviceId: 'C2:33:14:89:FE:10', nombre: 'Smart TV Salon', rssi: -82, uuids: ['180F'], fechaDeteccion: new Date().toISOString(), distanciaAprox: 'Lejos' },
          { deviceId: 'FA:81:09:55:01:43', nombre: 'Pulsera Smartband', rssi: -65, uuids: ['180D'], fechaDeteccion: new Date().toISOString(), distanciaAprox: 'Media' }
        ];
        this.escaneando = false;
      }, 2500);
    }
  }

  // 3. Detiene el escaneo
  async detenerRadar(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await BleClient.stopLEScan();
      } catch (error) {
        console.error('Error al detener escaneo:', error);
      }
    }
    this.escaneando = false;
  }

  // 4. Conecta y lee servicios internos (para la Vista Detalle)
  async obtenerDetalleDispositivo(deviceId: string): Promise<ServicioBleNativo[]> {
    if (!Capacitor.isNativePlatform()) {
      return [{ uuid: '180A', characteristics: [] }];
    }
    try {
      await BleClient.connect(deviceId);
      const servicios = await BleClient.getServices(deviceId);
      await BleClient.disconnect(deviceId);
      return servicios;
    } catch (error) {
      console.error('Error al obtener detalle del dispositivo:', error);
      return [];
    }
  }

  private guardarOActualizar(res: ScanResult): void {
    const rssi = res.rssi ?? -100;
    let distancia = 'Lejos';
    if (rssi > -65) distancia = 'Cerca';
    else if (rssi > -80) distancia = 'Media';

    const item: DispositivoRadar = {
      deviceId: res.device.deviceId,
      nombre: res.device.name || res.localName || 'Dispositivo desconocido',
      rssi: rssi,
      txPower: res.txPower,
      uuids: res.uuids ?? [],
      fechaDeteccion: new Date().toISOString(),
      distanciaAprox: distancia
    };

    const index = this.dispositivos.findIndex(d => d.deviceId === item.deviceId);
    if (index >= 0) {
      this.dispositivos[index] = item;
    } else {
      this.dispositivos.push(item);
    }
  }
}