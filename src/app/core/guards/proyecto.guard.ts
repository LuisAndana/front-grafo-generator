// src/app/core/guards/proyecto.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProyectoActivoService } from '../services/proyecto-activo.service';

/**
 * Protege rutas que necesitan un proyecto activo.
 * Si no hay proyecto seleccionado redirige a /proyectos.
 */
export const proyectoGuard: CanActivateFn = () => {
  const proyectoSvc = inject(ProyectoActivoService);
  const router      = inject(Router);

  if (proyectoSvc.proyectoId) {
    return true;
  }

  router.navigate(['/proyectos']);
  return false;
};