/**
 * Modelos de datos de BLE Radar.
 *
 * Son el "contrato" entre el radar (plugin BLE), las pantallas y la API PHP.
 * Si el backend usa otros nombres de campo, se traduce UNA sola vez en
 * services/observaciones.service.ts (funciones deApi / haciaApi) y las
 * pantallas no se tocan.
 */

/** Dispositivo detectado por el escaneo BLE (vive en memoria, no en BD). */
export interface Dispositivo {
  /** MAC (Android) o deviceId que entrega el plugin. Identifica al dispositivo. */
  id: string;
  /** Nombre anunciado; null si el dispositivo no anuncia nombre. */
  nombre: string | null;
  /** Intensidad de señal en dBm (negativo; más cercano a 0 = más cerca). */
  rssi: number;
  fabricante: string | null;
  conectable: boolean;
  /** UUID de los servicios anunciados (128 bits o 16 bits en hex). */
  uuids: string[];
  /** Marca de tiempo (ms, Date.now()) de la última vez que se vio. */
  visto: number;
}

/** Registro guardado en la base de datos mediante la API PHP. */
export interface Observacion {
  id: number;
  dispositivoId: string;
  nombre: string | null;
  rssi: number;
  fabricante: string | null;
  conectable: boolean;
  uuids: string[];
  /** Fecha y hora de la observación en ISO 8601. */
  visto: string;
}

/** Filtros del radar (pantalla Filtro). */
export interface Filtros {
  /** RSSI mínimo en dBm. -100 = sin límite. */
  rssiMin: number;
  /** Texto a buscar en nombre o MAC. */
  texto: string;
  soloConNombre: boolean;
  soloConectables: boolean;
}

export const FILTROS_POR_DEFECTO: Filtros = {
  rssiMin: -100,
  texto: '',
  soloConNombre: false,
  soloConectables: false,
};

/** Preferencias de la app (pantalla Ajustes). */
export interface Ajustes {
  /** URL base de la API PHP, p. ej. http://192.168.1.10/ble-radar/api */
  urlApi: string;
  /** Registrar automáticamente cada dispositivo nuevo que aparezca. */
  guardadoAutomatico: boolean;
  /** Mantener la pantalla encendida mientras se escanea. */
  pantallaEncendida: boolean;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  urlApi: 'http://192.168.1.10/ble-radar/api',
  guardadoAutomatico: false,
  pantallaEncendida: true,
};

/** Rango del historial. */
export type RangoHistorial = 'hoy' | 'semana' | 'todos';

/** Límites del slider de RSSI. */
export const RSSI_MIN = -100;
export const RSSI_MAX = -40;
