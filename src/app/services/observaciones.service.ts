import { Injectable, inject } from '@angular/core';
import axios from 'axios';
import { Dispositivo, Observacion, RangoHistorial } from '../data/modelos';
import { AjustesService } from './ajustes.service';

type RegistroApi = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class ObservacionesService {
  private readonly ajustes = inject(AjustesService);

  /** Historial filtrado por rango (hoy | semana | todos) y texto (nombre o MAC). */
  async listar(rango: RangoHistorial, texto: string): Promise<Observacion[]> {
    const respuesta = await axios.get<unknown>(`${this.urlBase()}/observaciones.php`, {
      params: { rango, q: texto.trim() },
      timeout: 10_000,
    });
    const datos = Array.isArray(respuesta.data)
      ? respuesta.data
      : this.comprobarRegistro(respuesta.data, 'La respuesta de observaciones')['data'];
    if (!Array.isArray(datos)) {
      throw new Error('La API debe devolver una lista de observaciones o un objeto con la propiedad data.');
    }

    const lista = datos.map((dato) => this.deApi(dato));

    // Filtrado coherente por rango (Hoy | Semana | Todos) y búsqueda
    const q = texto.trim().toLowerCase();
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const desde = rango === 'hoy' ? inicioHoy : rango === 'semana' ? inicioHoy - 6 * 86_400_000 : 0;

    return lista.filter((o) => {
      const tiempo = new Date(o.visto).getTime();
      const cumpleRango = rango === 'todos' || tiempo >= desde;
      const cumpleBusqueda = !q || (o.nombre ?? '').toLowerCase().includes(q) || o.dispositivoId.toLowerCase().includes(q);
      return cumpleRango && cumpleBusqueda;
    });
  }

  /** Guarda una observación del dispositivo (botón «Guardar observación» y guardado automático). */
  async guardar(dispositivo: Dispositivo): Promise<Observacion> {
    const respuesta = await axios.post<unknown>(
      `${this.urlBase()}/observaciones.php`,
      {
        dispositivoId: dispositivo.id,
        device_id: dispositivo.id,
        nombre: dispositivo.nombre,
        rssi: dispositivo.rssi,
        fabricante: dispositivo.fabricante,
        conectable: dispositivo.conectable,
        uuids: dispositivo.uuids,
        nota: `Observación de ${dispositivo.nombre || dispositivo.id}`,
        visto: new Date(dispositivo.visto).toISOString(),
      },
      { timeout: 10_000 },
    );

    // Se extrae el resultado y el ID devuelto por la API para construir la Observacion guardada
    const resultado = this.comprobarRegistro(
      (respuesta.data as any)?.data || respuesta.data, 
      'La respuesta de guardado'
    );
    const id = this.numero(resultado['id'], 'id');
    
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

  /** Prueba de conexión (botón de Ajustes). Devuelve los ms que tardó; lanza Error si falla. */
  async probarConexion(url: string): Promise<number> {
    const base = this.normalizarUrl(url);
    const inicio = Date.now();
    await axios.get(`${base}/health`, { timeout: 10_000 });
    return Date.now() - inicio;
  }

  private urlBase(): string {
    return this.normalizarUrl(this.ajustes.obtener().urlApi);
  }

  private normalizarUrl(url: string): string {
    let base: URL;
    try {
      base = new URL(url.trim());
    } catch {
      throw new Error('Ingresa una URL válida para la API.');
    }
    if (base.protocol !== 'http:' && base.protocol !== 'https:') {
      throw new Error('La URL de la API debe empezar con http:// o https://.');
    }
    if (base.search || base.hash) {
      throw new Error('La URL base de la API no debe incluir parámetros ni fragmentos.');
    }
    return base.toString().replace(/\/+$/, '');
  }

  private deApi(valor: unknown): Observacion {
    const registro = this.comprobarRegistro(valor, 'Una observación');
    const id = this.numero(registro['id'], 'id');
    const dispositivoId = this.texto(registro['dispositivoId'] ?? registro['device_id'], 'dispositivoId');
    const nombre = this.textoOpcional(registro['nombre']);
    const rssi = registro['rssi'] !== null && registro['rssi'] !== undefined && registro['rssi'] !== ''
      ? this.numero(registro['rssi'], 'rssi')
      : null;
    const fabricante = this.textoOpcional(registro['fabricante']);
    const conectable = registro['conectable'] !== undefined && registro['conectable'] !== null
      ? this.booleano(registro['conectable'])
      : true;

    // La tabla SQL observaciones no guarda uuids; aseguramos un array vacío si no viene
    let uuids: string[] = [];
    if (Array.isArray(registro['uuids'])) {
      uuids = registro['uuids'].filter((uuid): uuid is string => typeof uuid === 'string');
    }

    // Soporte para formato MySQL 'YYYY-MM-DD HH:MM:SS' o ISO
    const crudoFecha = registro['visto'] ?? registro['creado_en'];
    let vistoIso: string;
    if (typeof crudoFecha === 'string') {
      const normalizado = crudoFecha.includes('T') ? crudoFecha : crudoFecha.replace(' ', 'T');
      const timestamp = Date.parse(normalizado);
      vistoIso = !Number.isNaN(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString();
    } else {
      vistoIso = new Date().toISOString();
    }

    return { id, dispositivoId, nombre, rssi, fabricante, conectable, uuids, visto: vistoIso };
  }

  private comprobarRegistro(valor: unknown, contexto: string): RegistroApi {
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
      throw new Error(`${contexto} debe ser un objeto JSON.`);
    }
    return valor as RegistroApi;
  }

  private texto(valor: unknown, campo: string): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      throw new Error(`La propiedad ${campo} de la respuesta de la API debe ser texto.`);
    }
    return valor;
  }

  private textoOpcional(valor: unknown): string | null {
    if (valor === null || valor === undefined) return null;
    if (typeof valor !== 'string') throw new Error('Una propiedad de texto de la respuesta de la API no es válida.');
    return valor;
  }

  private numero(valor: unknown, campo: string): number {
    const numero = typeof valor === 'number' ? valor : typeof valor === 'string' ? Number(valor) : Number.NaN;
    if (!Number.isFinite(numero)) {
      throw new Error(`La propiedad ${campo} de la respuesta de la API debe ser numérica.`);
    }
    return numero;
  }

  private booleano(valor: unknown): boolean {
    if (valor === true || valor === 1 || valor === '1' || valor === 'true') return true;
    if (valor === false || valor === 0 || valor === '0' || valor === 'false') return false;
    throw new Error('La propiedad conectable de la respuesta de la API debe ser booleana.');
  }
}