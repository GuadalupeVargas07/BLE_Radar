import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';

describe('ApiService', () => {
  const apiUrl = 'http://192.168.1.66:8080/ble_radar/api';
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('api_url', `${apiUrl}/`);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('api_url');
  });

  it('comprueba el health.php dinámico y requiere confirmación de MySQL', async () => {
    const resultado = service.verificarConexion();
    const request = http.expectOne(`${apiUrl}/health.php`);

    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: { db: 'ok' } });

    await expectAsync(resultado).toBeResolved();
  });

  it('informa cuando health.php no confirma conexión a MySQL', async () => {
    const resultado = service.verificarConexion();
    const request = http.expectOne(`${apiUrl}/health.php`);

    request.flush({ success: false, error: 'MySQL no disponible' });

    await expectAsync(resultado).toBeRejectedWithError('MySQL no disponible');
  });
});
