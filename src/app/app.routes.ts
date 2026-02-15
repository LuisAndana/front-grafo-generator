import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'proyecto',
    pathMatch: 'full'
  },
  {
    path: 'proyecto',
    loadChildren: () =>
      import('./features/proyecto/proyecto.module')
        .then(m => m.ProyectoModule)
  },
  {
    path: 'stakeholders',
    loadChildren: () =>
      import('./features/stakeholders/stakeholders-module')
        .then(m => m.StakeholdersModule)
  },
  {
    path: 'usuarios',
    loadChildren: () =>
      import('./features/usuarios/usuarios-module')
        .then(m => m.UsuariosModule)
  },
  {
    path: 'elicitacion',
    loadChildren: () =>
      import('./features/elicitacion/elicitacion-module')
        .then(m => m.ElicitacionRoutingModule)
  },
  {
    path: 'requerimientos',
    loadChildren: () =>
      import('./features/requerimientos/requerimientos-module')
        .then(m => m.RequerimientosRoutingModule)
  },
 {
  path: 'negociacion',
  loadChildren: () =>
    import('./features/negociacion/negociacion-module').then(
      (m) => m.NegociacionRoutingModule
    ),
},
  {
    path: 'srs',
    loadChildren: () =>
      import('./features/srs/srs-module')
        .then(m => m.SrsModule)
  },
  {
    path: 'validacion',
    loadChildren: () =>
      import('./features/validacion/validacion-module')
        .then(m => m.ValidacionModule)
  },
  {
    path: 'generador',
    loadChildren: () =>
      import('./features/generador/generador-module')
        .then(m => m.GeneradorModule)
  }
];
