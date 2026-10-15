import { Dispositivo, Filtros, FILTROS_POR_DEFECTO } from '../data/modelos';

/** Aplica los filtros del radar a la lista de dispositivos detectados. */
export function aplicarFiltros(lista: Dispositivo[], f: Filtros): Dispositivo[] {
  const q = f.texto.trim().toLowerCase();
  return lista.filter(
    (d) =>
      d.rssi >= f.rssiMin &&
      (!f.soloConNombre || !!(d.nombre && d.nombre.trim())) &&
      (!f.soloConectables || d.conectable) &&
      (!q || (d.nombre ?? '').toLowerCase().includes(q) || d.id.toLowerCase().includes(q)),
  );
}

/** Cuántos filtros están activos (para el puntito del botón de filtros). */
export function contarFiltrosActivos(f: Filtros): number {
  return (
    (f.rssiMin > FILTROS_POR_DEFECTO.rssiMin ? 1 : 0) +
    (f.texto.trim() ? 1 : 0) +
    (f.soloConNombre ? 1 : 0) +
    (f.soloConectables ? 1 : 0)
  );
}
