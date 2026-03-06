import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Todas las rutas renderizan en el cliente (browser)
    // Esto evita que Angular intente ejecutar guards/interceptores en el servidor
    // donde localStorage no está disponible
    path: '**',
    renderMode: RenderMode.Client
  }
];