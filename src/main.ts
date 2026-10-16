import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { provideHttpClient } from '@angular/common/http';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Call the element loader before the bootstrapApplication call
defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
}).catch((err) => console.error(err));
