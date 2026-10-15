import { Injectable } from '@angular/core';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { environment } from '../../environments/environment';

export interface HealthResponse {
  success: boolean;
  data?: {
    php: string;
    db: string;
  };
  error?: string;
}

export interface Observacion {
  id?: number;
  device_id: string; // MAC o UUID del dispositivo BLE
  nombre?: string | null;
  rssi?: number | null; // Nulo si no está disponible
  nota: string;
  creado_en?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: environment.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Interceptor para manejar errores formateados según la regla
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        const method = error.config?.method?.toUpperCase() || 'DESCONOCIDO';
        const url = error.config?.url || '';
        const status = error.response?.status || 'SIN_RESPUESTA';
        const errorMsg =
          error.response?.data?.error ||
          error.message ||
          'Error de conexión con el servidor';

        console.error(`[API Error] ${method} ${url} | HTTP ${status}: ${errorMsg}`);

        return Promise.reject({
          success: false,
          status,
          method,
          url,
          error: `[${method} ${status}] ${errorMsg}`
        });
      }
    );
  }

  /**
   * GET api/health.php
   * Revisa el estado de la API y de MySQL
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await this.axiosInstance.get<HealthResponse>('/health.php');
      return response.data;
    } catch (error: any) {
      return error;
    }
  }

  /**
   * GET api/observaciones.php
   * Lista todas las observaciones guardadas
   */
  async getObservaciones(): Promise<ApiResponse<Observacion[]>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Observacion[]>>('/observaciones.php');
      return response.data;
    } catch (error: any) {
      return error;
    }
  }

  /**
   * POST api/observaciones.php
   * Guarda una observación BLE.
   * Privacidad BLE: los campos nombre y rssi pueden ser null.
   */
  async createObservacion(obs: Observacion): Promise<ApiResponse<{ id: number }>> {
    try {
      const payload = {
        device_id: obs.device_id,
        nombre: obs.nombre ?? null,
        rssi: obs.rssi ?? null,
        nota: obs.nota || ''
      };

      const response = await this.axiosInstance.post<ApiResponse<{ id: number }>>(
        '/observaciones.php',
        payload
      );
      return response.data;
    } catch (error: any) {
      return error;
    }
  }

  /**
   * Subida de archivos (Fotos / Audios) usando FormData
   * - Restringe a máximo 8 MB.
   * - Muestra errores legibles.
   */

  async uploadFile(file: File, endpoint: string = '/upload.php'): Promise<ApiResponse> {
    const MAX_SIZE_MB = 8;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      return {
        success: false,
        error: `El archivo supera el límite permitido de ${MAX_SIZE_MB} MB.`
      };
    }

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const response = await this.axiosInstance.post<ApiResponse>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return error;
    }
  }
}