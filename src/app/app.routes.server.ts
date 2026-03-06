import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'bienvenida',
    renderMode: RenderMode.Client  // ← login necesita localStorage
  },
  {
    path: 'proyecto',
    renderMode: RenderMode.Client
  },
  {
    path: 'stakeholders',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client  // ← todas en cliente por ahora
  }
];