import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. Cuando la app inicia, redirige automáticamente a tu pantalla de bienvenida
  { path: '', redirectTo: 'bienvenida', pathMatch: 'full' },
  
  // 2. Tu pantalla de bienvenida independiente
  { path: 'bienvenida', loadComponent: () => import('./bienvenida/bienvenida.page').then((m) => m.BienvenidaPage) },
  
  // 3. Tu pantalla de detalles
  { path: 'detalle/:id', loadComponent: () => import('./detalle/detalle.page').then((m) => m.DetallePage) },

  // 4. Las pestañas (SE DEJA EL PATH VACÍO porque tabs.routes.ts ya define 'tabs' adentro)
  { path: '', loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes) },
];