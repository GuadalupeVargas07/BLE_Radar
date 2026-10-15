/** Nombres de los servicios GATT más comunes (UUID de 16 bits). Amplía la lista si hace falta. */
const SERVICIOS_GATT: Record<string, string> = {
  '1800': 'Acceso genérico',
  '1801': 'Atributo genérico',
  '180a': 'Información del dispositivo',
  '180d': 'Frecuencia cardíaca',
  '180f': 'Batería',
  '1810': 'Presión arterial',
  '1816': 'Velocidad y cadencia',
  '181a': 'Sensor ambiental',
  'fe9f': 'Servicio de Google',
};

/**
 * Acepta un UUID de 16 bits ("180d") o de 128 bits
 * ("0000180d-0000-1000-8000-00805f9b34fb") y devuelve su nombre legible.
 */
export function describirUuid(uuid: string): { corto: string; nombre: string } {
  const limpio = uuid.toLowerCase();
  const corto = limpio.length > 4 ? limpio.slice(4, 8) : limpio;
  return {
    corto: `0x${corto.toUpperCase()}`,
    nombre: SERVICIOS_GATT[corto] ?? 'Servicio desconocido',
  };
}
