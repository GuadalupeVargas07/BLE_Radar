import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Dispositivo } from '../data/modelos';
import { ObservacionesService } from './observaciones.service';

describe('ObservacionesService', () => {
  const apiUrl = 'http://192.168.1.66:8080/ble_radar/api';
  let service: ObservacionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('api_url', `${apiUrl}/`);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ObservacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('api_url');
  });

  it('lee y convierte observaciones desde la URL dinámica configurada', async () => {
    const resultado = service.listar('todos', 'beacon');
    const request = http.expectOne(`${apiUrl}/observaciones.php`);

    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: [{
        id: 42,
        device_id: 'AA:BB:CC:DD:EE:42',
        nombre: 'Beacon de prueba',
        rssi: -62,
        creado_en: new Date().toISOString(),
      }],
    });

    const observaciones = await resultado;
    expect(observaciones.length).toBe(1);
    expect(observaciones[0].dispositivoId).toBe('AA:BB:CC:DD:EE:42');
    expect(observaciones[0].rssi).toBe(-62);
  });

  it('guarda observaciones en el mismo servidor dinámico', async () => {
    const dispositivo: Dispositivo = {
      id: 'AA:BB:CC:DD:EE:43',
      nombre: 'Beacon guardado',
      rssi: -58,
      fabricante: null,
      conectable: true,
      uuids: [],
      visto: Date.now(),
    };
    const resultado = service.guardar(dispositivo);
    const request = http.expectOne(`${apiUrl}/observaciones.php`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      device_id: dispositivo.id,
      nombre: dispositivo.nombre,
      rssi: dispositivo.rssi,
      nota: '',
    });
    request.flush({ success: true, data: { id: 43 } });

    expect((await resultado).id).toBe(43);
  });
});
