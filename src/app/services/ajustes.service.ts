import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AjustesApp {
  urlApi: string;
  guardadoAutomatico: boolean;
  pantallaEncendida: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AjustesService {
  private defaultUrl = 'http://192.168.1.10/ble_radar/api';

  private ajustesState: AjustesApp = {
    urlApi: (localStorage.getItem('api_url') || this.defaultUrl)
      .trim()
      .replace(/\/ble-radar\/api\/?$/i, '/ble_radar/api')
      .replace(/\/+$/, ''),
    guardadoAutomatico: localStorage.getItem('guardado_auto') === 'true',
    pantallaEncendida: localStorage.getItem('pantalla_encendida') === 'true'
  };

  private apiUrlSubject = new BehaviorSubject<string>(this.ajustesState.urlApi);
  apiUrl$ = this.apiUrlSubject.asObservable();

  constructor() {}

  /**
   * Método requerido por Tab1Page y otros componentes
   */
  obtener(): AjustesApp {
    return { ...this.ajustesState };
  }

  /**
   * Retorna la URL de la API
   */
  getApiUrl(): string {
    return this.ajustesState.urlApi;
  }

  /**
   * Guarda o actualiza la URL de la API
   */
  setApiUrl(url: string): void {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    this.ajustesState.urlApi = cleanUrl;
    localStorage.setItem('api_url', cleanUrl);
    this.apiUrlSubject.next(cleanUrl);
  }

  /**
   * Modifica propiedades opcionales/switches de ajustes
   */
  guardar(nuevosAjustes: Partial<AjustesApp>): void {
    this.ajustesState = { ...this.ajustesState, ...nuevosAjustes };
    if (nuevosAjustes.urlApi !== undefined) {
      this.setApiUrl(nuevosAjustes.urlApi);
    }
    if (nuevosAjustes.guardadoAutomatico !== undefined) {
      localStorage.setItem('guardado_auto', String(nuevosAjustes.guardadoAutomatico));
    }
    if (nuevosAjustes.pantallaEncendida !== undefined) {
      localStorage.setItem('pantalla_encendida', String(nuevosAjustes.pantallaEncendida));
    }
  }
}