import { inject, Injectable } from '@angular/core';
import { Dispositivo, Observacion, RangoHistorial } from '../data/modelos';
import { ApiService } from './api.service';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

interface ObservacionApi {
  id?: number | string;
  device_id?: string;
  nombre?: string | null;
  rssi?: number | string | null;
  nota?: string;
  creado_en?: string;
  visto?: string;
}

@Injectable({ providedIn: 'root' })
export class ObservacionesService {
  private readonly api = inject(ApiService);

  /** Historial filtrado por rango (hoy | semana | todos) y texto (nombre o MAC). */
  async listar(rango: RangoHistorial, texto: string): Promise<Observacion[]> {
    const respuesta = await this.api.get<unknown>('observaciones.php');
    const registros = this.leerLista(respuesta);
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const desde = rango === 'hoy' ? inicioHoy : rango === 'semana' ? inicioHoy - 6 * 86_400_000 : 0;
    const q = texto.trim().toLowerCase();
    return registros
      .map((registro) => this.convertir(registro))
      .filter((o) => {
        const visto = new Date(o.visto).getTime();
        return visto >= desde &&
          (!q || (o.nombre ?? '').toLowerCase().includes(q) || o.dispositivoId.toLowerCase().includes(q));
      });
  }

  /** Guarda una observación del dispositivo (botón «Guardar observación» y guardado automático). */
  async guardar(dispositivo: Dispositivo): Promise<Observacion> {
    const respuesta = await this.api.post<unknown>('observaciones.php', {
      device_id: dispositivo.id,
      nombre: dispositivo.nombre,
      rssi: dispositivo.rssi,
      nota: '',
    });
    const resultado = this.leerResultado(respuesta);
    const id = Number(resultado['id']);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('La API no devolvió el ID de la observación guardada.');
    }
    return {
      id,
      dispositivoId: dispositivo.id,
      nombre: dispositivo.nombre,
      rssi: dispositivo.rssi,
      fabricante: dispositivo.fabricante,
      conectable: dispositivo.conectable,
      uuids: dispositivo.uuids,
      visto: new Date().toISOString(),
    };
  }

  private leerLista(respuesta: unknown): ObservacionApi[] {
    let datos = respuesta;
    if (this.esSobreApi(respuesta)) {
      if (respuesta.success === false) {
        throw new Error(respuesta.error || 'La API rechazó la consulta del historial.');
      }
      datos = respuesta.data;
    }
    if (!Array.isArray(datos)) {
      throw new Error('La respuesta de observaciones.php no contiene una lista.');
    }
    return datos.map((registro, indice) => {
      if (!this.esObservacionApi(registro)) {
        throw new Error(`La observación ${indice + 1} tiene un formato no válido.`);
      }
      return registro;
    });
  }

  private leerResultado(respuesta: unknown): Record<string, unknown> {
    let resultado = respuesta;
    if (this.esSobreApi(respuesta)) {
      if (respuesta.success !== true) {
        throw new Error(respuesta.error || 'La API no confirmó el guardado.');
      }
      resultado = respuesta.data;
    }
    if (!this.esRegistro(resultado)) {
      throw new Error('La respuesta de observaciones.php no contiene el ID guardado.');
    }
    return resultado;
  }

  private convertir(registro: ObservacionApi): Observacion {
    if (typeof registro.device_id !== 'string' || !registro.device_id ||
        (typeof registro.id !== 'number' && typeof registro.id !== 'string') || !registro.id) {
      throw new Error('La API devolvió una observación sin ID o sin device_id.');
    }
    const fecha = registro.creado_en || registro.visto;
    if (typeof fecha !== 'string' || Number.isNaN(new Date(fecha.replace(' ', 'T')).getTime())) {
      throw new Error(`La observación ${registro.id} no contiene una fecha válida.`);
    }
    const rssi = registro.rssi === null || registro.rssi === undefined ? null : Number(registro.rssi);
    if (rssi !== null && !Number.isFinite(rssi)) {
      throw new Error(`La observación ${registro.id} contiene un RSSI no válido.`);
    }
    return {
      id: Number(registro.id),
      dispositivoId: registro.device_id,
      nombre: registro.nombre ?? null,
      rssi,
      fabricante: null,
      conectable: false,
      uuids: [],
      visto: new Date(fecha.replace(' ', 'T')).toISOString(),
    };
  }

  private esSobreApi(value: unknown): value is ApiEnvelope<unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) &&
      ('success' in value || 'data' in value || 'error' in value);
  }

  private esRegistro(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private esObservacionApi(value: unknown): value is ObservacionApi {
    if (!this.esRegistro(value)) return false;
    return (value['id'] === undefined || typeof value['id'] === 'number' || typeof value['id'] === 'string') &&
      (value['device_id'] === undefined || typeof value['device_id'] === 'string') &&
      (value['nombre'] === undefined || value['nombre'] === null || typeof value['nombre'] === 'string') &&
      (value['rssi'] === undefined || value['rssi'] === null ||
        typeof value['rssi'] === 'number' || typeof value['rssi'] === 'string') &&
      (value['creado_en'] === undefined || typeof value['creado_en'] === 'string') &&
      (value['visto'] === undefined || typeof value['visto'] === 'string');
  }
}
