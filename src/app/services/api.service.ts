import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { AjustesService } from './ajustes.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly ajustesService = inject(AjustesService);

  /**
   * Obtiene la URL base activa configurada en AjustesService
   */
  private get baseUrl(): string {
    return this.ajustesService.getApiUrl();
  }

  private urlFor(endpoint: string): string {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${path}`;
  }

  /**
   * Verifica que la API y su conexión a MySQL estén disponibles.
   */
  async verificarConexion(): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.get<{ success?: boolean; status?: string; error?: string; message?: string }>(this.urlFor('health.php'))
        .pipe(timeout({ first: 8000 }))
    );
    const esExitoso = respuesta.success === true || respuesta.status === 'ok';
    if (!esExitoso) {
      throw new Error(respuesta.error || respuesta.message || 'La API respondió, pero no confirmó la conexión a MySQL.');
    }
  }

  /**
   * Realiza una petición GET a la API configurada en Ajustes.
   */
  async get<T>(endpoint: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.urlFor(endpoint)).pipe(timeout({ first: 10000 })));
  }

  /**
   * Realiza una petición POST a la API configurada en Ajustes.
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.urlFor(endpoint), body).pipe(timeout({ first: 10000 })));
  }
}