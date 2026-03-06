import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'bienvenida',
    pathMatch: 'full'
  },
  {
    path: 'bienvenida',
    loadComponent: () =>
      import('./features/bienvenida/bienvenida.component')
        .then(m => m.BienvenidaComponent)
    // ← sin guard: es la página pública
  },

  // ── Rutas protegidas ────────────────────────────────────────────────────────
  {
    path: 'proyecto',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/proyecto/proyecto.module')
        .then(m => m.ProyectoModule)
  },
  {
    path: 'stakeholders',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/stakeholders/stakeholders-module')
        .then(m => m.StakeholdersModule)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/usuarios/usuarios-module')
        .then(m => m.UsuariosModule)
  },
  {
    path: 'focus-group',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/focus-group/focus-group.module')
        .then(m => m.FocusGroupModule)
  },
  {
    path: 'elicitacion',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/elicitacion/elicitacion-module')
        .then(m => m.ElicitacionRoutingModule)
  },
  {
    path: 'encuesta',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/elicitacion/encuesta/pages/encuesta/encuesta.component')
        .then(m => m.EncuestaComponent)
  },
  {
    path: 'historial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/historial/pages/historial/historial.component')
        .then(m => m.HistorialComponent)
  },
  {
    path: 'requerimientos',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/requerimientos/requerimientos-module')
        .then(m => m.RequerimientosRoutingModule)
  },
  {
    path: 'observacion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/observacion/pages/observacion-form/observacion-form')
        .then(m => m.ObservacionFormComponent)
  },
  {
    path: 'seguimiento-transaccional',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/seguimiento-trans/pages/seguimiento-trans-form/seguimiento-trans-form')
        .then(m => m.SeguimientoTransFormComponent)
  },
  {
    path: 'negociacion',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/negociacion/negociacion-module')
        .then(m => m.NegociacionRoutingModule)
  },
  {
    path: 'srs',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/srs/srs-module')
        .then(m => m.SrsModule)
  },
  {
    path: 'validacion',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/validacion/validacion-module')
        .then(m => m.ValidacionModule)
  },
  {
    path: 'generador',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/generador/generador-module')
        .then(m => m.GeneradorModule)
  },

  // ── Fallback ────────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'bienvenida'
  }
];