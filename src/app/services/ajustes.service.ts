import { Injectable } from '@angular/core';
import { Ajustes, AJUSTES_POR_DEFECTO } from '../data/modelos';

const CLAVE = 'bleradar:ajustes';

/**
 * Preferencias de la app guardadas en el dispositivo (localStorage).
 * En el teléfono se puede cambiar a @capacitor/preferences sin tocar las pantallas:
 * solo hay que modificar leer() y guardar().
 */
@Injectable({ providedIn: 'root' })
export class AjustesService {
  private actual: Ajustes = this.leer();

  obtener(): Ajustes {
    return { ...this.actual };
  }

  cambiar<K extends keyof Ajustes>(clave: K, valor: Ajustes[K]): void {
    this.actual = { ...this.actual, [clave]: valor };
    this.guardar();
  }

  private leer(): Ajustes {
    try {
      const crudo = localStorage.getItem(CLAVE);
      return crudo ? { ...AJUSTES_POR_DEFECTO, ...JSON.parse(crudo) } : { ...AJUSTES_POR_DEFECTO };
    } catch {
      return { ...AJUSTES_POR_DEFECTO };
    }
  }

  private guardar(): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.actual));
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }
}
