/**
 * DATOS DE EJEMPLO (solo para la demostración visual).
 * Los dispositivos, MAC y fabricantes son inventados. Cuando el plugin BLE y
 * la API estén conectados, este archivo se puede borrar junto con las partes
 * marcadas con "DEMO" en los servicios.
 */
import { Dispositivo, Observacion } from './modelos';

const u = (corto: string) => `0000${corto}-0000-1000-8000-00805f9b34fb`;

/** Dispositivos que "aparecen" en el radar simulado. `rssi` es el valor base alrededor del cual fluctúa. */
export const DISPOSITIVOS_EJEMPLO: Omit<Dispositivo, 'visto'>[] = [
  { id: 'A4:C1:38:5F:92:0B', nombre: 'Mi Band 7',   rssi: -48, fabricante: 'Huami',   conectable: true,  uuids: [u('180d'), u('180f'), u('180a'), u('1800')] },
  { id: 'F0:AC:D7:11:6E:3C', nombre: 'JBL Flip 5',  rssi: -57, fabricante: 'JBL',     conectable: true,  uuids: [u('1800'), u('180f')] },
  { id: 'E2:19:7B:44:C0:1D', nombre: 'Charge 5',    rssi: -64, fabricante: 'Fitbit',  conectable: true,  uuids: [u('180d'), u('180a')] },
  { id: 'C8:2E:18:AB:63:F4', nombre: 'Smart TV',    rssi: -69, fabricante: 'Samsung', conectable: false, uuids: [u('1800')] },
  { id: '5C:E9:1E:7A:04:D2', nombre: null,          rssi: -72, fabricante: null,      conectable: false, uuids: [] },
  { id: 'B8:D7:AF:20:5A:91', nombre: 'Galaxy Buds', rssi: -78, fabricante: 'Samsung', conectable: true,  uuids: [u('180f'), u('1800')] },
  { id: 'D4:3A:65:B1:0E:77', nombre: 'Tile Mate',   rssi: -86, fabricante: 'Tile',    conectable: true,  uuids: [u('fe9f')] },
  { id: '7A:3C:90:12:EE:55', nombre: null,          rssi: -91, fabricante: null,      conectable: false, uuids: [] },
];

/** Historial inicial de la demostración (fechas relativas a "ahora"). */
export function observacionesEjemplo(ahora = Date.now()): Observacion[] {
  const hace = (minutos: number) => new Date(ahora - minutos * 60_000).toISOString();
  const base = (i: number) => DISPOSITIVOS_EJEMPLO[i];
  const fila = (id: number, i: number, rssi: number, min: number): Observacion => ({
    id,
    dispositivoId: base(i).id,
    nombre: base(i).nombre,
    rssi,
    fabricante: base(i).fabricante,
    conectable: base(i).conectable,
    uuids: base(i).uuids,
    visto: hace(min),
  });
  return [
    fila(6, 0, -51, 63),
    fila(5, 6, -86, 52),
    fila(4, 5, -78, 38),
    fila(3, 4, -72, 25),
    fila(2, 1, -57, 12),
    fila(1, 0, -48, 5),
    // Ayer y antes: para que se vea el filtro "Semana" / "Todos"
    fila(0, 2, -66, 60 * 26),
  ].sort((a, b) => b.visto.localeCompare(a.visto));
}
