import { Injectable } from '@angular/core';
import { Dispositivo, Observacion, RangoHistorial } from '../data/modelos';
import { observacionesEjemplo } from '../data/ejemplos';

/* =========================================================================
   PUNTO DE CONEXIÓN CON EL BACKEND (Axios + API PHP).
   Las pantallas solo usan listar(), guardar() y probarConexion().
   Hoy devuelven datos de ejemplo (bloques "DEMO"): quien haga la conexión
   reemplaza el cuerpo de cada método por su llamada con Axios y borra el
   bloque DEMO. Las pantallas no cambian mientras se respeten los tipos de
   data/modelos.ts.
   ========================================================================= */
@Injectable({ providedIn: 'root' })
export class ObservacionesService {
  // DEMO: historial en memoria. Borrar al conectar la API.
  private demo: Observacion[] = observacionesEjemplo();
  private siguienteId = 100;

  /** Historial filtrado por rango (hoy | semana | todos) y texto (nombre o MAC). */
  async listar(rango: RangoHistorial, texto: string): Promise<Observacion[]> {
    // TODO(backend): axios.get(`${urlApi}/observaciones`, { params: { rango, q: texto } })

    // DEMO ↓
    await this.espera(250);
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const desde = rango === 'hoy' ? inicioHoy : rango === 'semana' ? inicioHoy - 6 * 86_400_000 : 0;
    const q = texto.trim().toLowerCase();
    return this.demo.filter(
      (o) =>
        new Date(o.visto).getTime() >= desde &&
        (!q || (o.nombre ?? '').toLowerCase().includes(q) || o.dispositivoId.toLowerCase().includes(q)),
    );
  }

  /** Guarda una observación del dispositivo (botón «Guardar observación» y guardado automático). */
  async guardar(dispositivo: Dispositivo): Promise<Observacion> {
    // TODO(backend): axios.post(`${urlApi}/observaciones`, { ... })

    // DEMO ↓
    await this.espera(400);
    const nueva: Observacion = {
      id: this.siguienteId++,
      dispositivoId: dispositivo.id,
      nombre: dispositivo.nombre,
      rssi: dispositivo.rssi,
      fabricante: dispositivo.fabricante,
      conectable: dispositivo.conectable,
      uuids: dispositivo.uuids,
      visto: new Date().toISOString(),
    };
    this.demo = [nueva, ...this.demo];
    return nueva;
  }

  /** Prueba de conexión (botón de Ajustes). Devuelve los ms que tardó; lanza Error si falla. */
  async probarConexion(url: string): Promise<number> {
    // TODO(backend): axios.get(`${url}/health`) y medir el tiempo

    // DEMO ↓
    await this.espera(450);
    if (!/^https?:\/\/.+/i.test(url.trim())) throw new Error('La URL debe empezar con http:// o https://');
    return 42;
  }

  private espera(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
