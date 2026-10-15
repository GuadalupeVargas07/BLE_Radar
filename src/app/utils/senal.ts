/**
 * Utilidades de presentación para RSSI, nombres y fechas.
 * Funciones puras: no dependen de Angular ni del plugin BLE.
 */
import { RSSI_MAX, RSSI_MIN } from '../data/modelos';

export type NivelSenal = 'strong' | 'medium' | 'weak';
export type DistanciaAproximada = 'Cerca' | 'Medio' | 'Lejos';

/** Fuerte >= -60 dBm, media -60 a -80, débil < -80. (Mismos cortes que el diseño). */
export function nivelSenal(rssi: number): NivelSenal {
  if (rssi >= -60) return 'strong';
  if (rssi >= -80) return 'medium';
  return 'weak';
}

/** Clasificación orientativa por intensidad RSSI; no equivale a una distancia en metros. */
export function distanciaAproximada(rssi: number): DistanciaAproximada {
  if (rssi >= -60) return 'Cerca';
  if (rssi >= -80) return 'Medio';
  return 'Lejos';
}

/** Cuántas barritas (1 a 4) se encienden. */
export function barras(rssi: number): number {
  if (rssi >= -50) return 4;
  if (rssi >= -60) return 3;
  if (rssi >= -80) return 2;
  return 1;
}

/** Arreglo [true,true,false,false] para pintar las 4 barras con *ngFor. */
export function barrasEncendidas(rssi: number): boolean[] {
  const n = barras(rssi);
  return [0, 1, 2, 3].map((i) => i < n);
}

/** "-48 dBm" con signo menos tipográfico. */
export function formatoRssi(rssi: number): string {
  return `${String(rssi).replace('-', '−')} dBm`;
}

export function nombreVisible(nombre: string | null): string {
  return nombre && nombre.trim() ? nombre : 'Sin nombre';
}

/** Hash estable (0..1) de un texto; sirve para que cada dispositivo tenga siempre el mismo ángulo en el radar. */
function hash01(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Posición del punto en el radar, en % del cuadro (0-100).
 * Distancia al centro según RSSI; ángulo estable según el id.
 */
export function posicionRadar(id: string, rssi: number): { x: number; y: number } {
  const t = Math.min(1, Math.max(0, (-rssi - 30) / 70)); // -30 dBm → 0 (centro), -100 dBm → 1 (borde)
  const radio = 0.1 + t * 0.8;                            // fracción del radio del radar
  const angulo = hash01(id) * Math.PI * 2;
  return {
    x: 50 + Math.cos(angulo) * radio * 50,
    y: 50 + Math.sin(angulo) * radio * 50,
  };
}

/** % de relleno del slider para el valor actual. */
export function rellenoSlider(valor: number): string {
  return `${((valor - RSSI_MIN) / (RSSI_MAX - RSSI_MIN)) * 100}%`;
}

/** "hace 2 s", "hace 5 min". */
export function hace(marcaMs: number, ahora = Date.now()): string {
  const s = Math.max(0, Math.round((ahora - marcaMs) / 1000));
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "17:42" */
export function horaCorta(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "Hoy · 13 oct", "Ayer · 12 oct" o "11 oct". */
export function etiquetaDia(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  const dia = `${d.getDate()} ${MESES[d.getMonth()]}`;
  const inicio = (f: Date) => new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
  const diff = Math.round((inicio(ahora) - inicio(d)) / 86_400_000);
  if (diff === 0) return `Hoy · ${dia}`;
  if (diff === 1) return `Ayer · ${dia}`;
  return dia;
}
