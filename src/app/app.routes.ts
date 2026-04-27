// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { proyectoGuard } from './core/guards/proyecto.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'proyectos',   // ← redirige al listado de proyectos
    pathMatch: 'full'
  },
  {
    path: 'bienvenida',
    loadComponent: () =>
      import('./features/bienvenida/bienvenida.component')
        .then(m => m.BienvenidaComponent)
  },

  // ── Listado de proyectos (auth pero sin proyectoGuard) ──────────────────────
  {
    path: 'proyectos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/proyecto/pages/proyectos-lista/proyectos-lista')
        .then(m => m.ProyectosLista)
  },

  // ── Rutas que requieren proyecto activo ─────────────────────────────────────
  {
    path: 'proyecto',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/proyecto/proyecto.module')
        .then(m => m.ProyectoModule)
  },
  {
    path: 'stakeholders',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/stakeholders/stakeholders-module')
        .then(m => m.StakeholdersModule)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/usuarios/usuarios-module')
        .then(m => m.UsuariosModule)
  },
  {
    path: 'focus-group',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/focus-group/focus-group.module')
        .then(m => m.FocusGroupModule)
  },
  {
    path: 'elicitacion',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/elicitacion/elicitacion-module')
        .then(m => m.ElicitacionRoutingModule)
  },
  {
    path: 'encuesta',
    canActivate: [authGuard, proyectoGuard],
    loadComponent: () =>
      import('./features/elicitacion/encuesta/pages/encuesta/encuesta.component')
        .then(m => m.EncuestaComponent)
  },
  {
    path: 'historial',
    canActivate: [authGuard, proyectoGuard],
    loadComponent: () =>
      import('./features/historial/pages/historial/historial.component')
        .then(m => m.HistorialComponent)
  },
  {
    path: 'requerimientos',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/requerimientos/requerimientos-module')
        .then(m => m.RequerimientosRoutingModule)
  },
  {
    path: 'rnf',
    canActivate: [authGuard, proyectoGuard],
    loadComponent: () =>
      import('./features/requerimientos/pages/rnf/rnf')
        .then(m => m.Rnf)
  },
  {
    path: 'observacion',
    canActivate: [authGuard, proyectoGuard],
    loadComponent: () =>
      import('./features/observacion/pages/observacion-form/observacion-form')
        .then(m => m.ObservacionFormComponent)
  },
  {
    path: 'seguimiento-transaccional',
    canActivate: [authGuard, proyectoGuard],
    loadComponent: () =>
      import('./features/seguimiento-trans/pages/seguimiento-trans-form/seguimiento-trans-form')
        .then(m => m.SeguimientoTransFormComponent)
  },
  {
    path: 'negociacion',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/negociacion/negociacion-module')
        .then(m => m.NegociacionRoutingModule)
  },
  {
    path: 'srs',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/srs/srs-module')
        .then(m => m.SrsModule)
  },
  {
    path: 'validacion',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/validacion/validacion-module')
        .then(m => m.ValidacionModule)
  },
  {
    path: 'generador',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/generador/generador-module')
        .then(m => m.GeneradorModule)
  },
  {
    path: 'diagramas',
    canActivate: [authGuard, proyectoGuard],
    loadChildren: () =>
      import('./features/diagramas/diagramas.module')
        .then(m => m.DiagramasModule)
  },
  {
    path: 'artefactos',
    canActivate: [authGuard, proyectoGuard],
    loadComponent: () =>
      import('./features/artefactos/pages/artefactos/artefactos.component')
        .then(m => m.ArtefactosComponent)
  },

  // ── Fallback ────────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'proyectos'
  }
];