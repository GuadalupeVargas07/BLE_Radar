import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { TimeoutError } from 'rxjs';
import { AjustesService, AjustesApp } from '../services/ajustes.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent
  ]
})
export class Tab3Page implements OnInit {
  private readonly ajustesService = inject(AjustesService);
  private readonly apiService = inject(ApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  ajustes!: AjustesApp;
  apiUrl: string = '';
  estadoConexion: 'sin_probar' | 'probando' | 'exito' | 'error' = 'sin_probar';
  mensajeError: string = '';
  version: string = '1.0.0';

  ngOnInit() {
    this.ajustes = this.ajustesService.obtener();
    this.apiUrl = this.ajustes.urlApi;
  }

  guardarConfiguracion() {
    if (this.apiUrl) {
      this.ajustesService.setApiUrl(this.apiUrl);
      this.ajustes = this.ajustesService.obtener();
    }
  }

  get usandoLocalhost(): boolean {
    try {
      const host = new URL(this.apiUrl).hostname.toLowerCase();
      return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    } catch {
      return false;
    }
  }

  cambiarSwitch(campo: 'guardadoAutomatico' | 'pantallaEncendida', event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    const valor = event.target.checked;
    this.ajustesService.guardar({ [campo]: valor });
    this.ajustes = this.ajustesService.obtener();
  }

  async probarConexion() {
    this.guardarConfiguracion();
    this.estadoConexion = 'probando';
    this.mensajeError = '';

    try {
      if (this.usandoLocalhost && Capacitor.isNativePlatform()) {
        throw new Error('En el celular, localhost apunta al propio teléfono. Usa la dirección IPv4 de la laptop, por ejemplo http://192.168.1.66/ble_radar/api.');
      }
      const url = new URL(this.apiUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('La dirección de la API debe empezar con http:// o https://.');
      }
      await this.apiService.verificarConexion();
      this.estadoConexion = 'exito';
    } catch (error) {
      this.estadoConexion = 'error';
      if (error instanceof Error && !(error instanceof HttpErrorResponse) && !(error instanceof TimeoutError)) {
        this.mensajeError = error.message;
      } else if (error instanceof HttpErrorResponse && error.status > 0) {
        this.mensajeError = error.status === 200
          ? 'health.php no devolvió JSON válido. Debe responder con success: true y comprobar la conexión a MySQL.'
          : `El servidor respondió con HTTP ${error.status}. Verifica que la ruta ${this.apiUrl}/health.php exista.`;
      } else if (error instanceof TimeoutError) {
        this.mensajeError = 'El servidor no respondió en 8 segundos. Revisa que el teléfono y el servidor estén en la misma red.';
      } else {
        this.mensajeError = 'No se pudo conectar con el servidor. Revisa la URL, la red local y que el servidor permita conexiones desde el teléfono.';
      }
    } finally {
      this.changeDetector.markForCheck();
    }
  }
}