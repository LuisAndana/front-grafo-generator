import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/focus-group-dashboard/focus-group-dashboard')
          .then(m => m.FocusGroupDashboardComponent),
        data: { title: 'Focus Group - Dashboard' }
      },
      {
        path: 'crear',
        loadComponent: () => import('./pages/focus-group-form/focus-group-form')
          .then(m => m.FocusGroupFormComponent),
        data: { title: 'Crear Focus Group' }
      },
      {
        path: 'editar/:id',
        loadComponent: () => import('./pages/focus-group-form/focus-group-form')
          .then(m => m.FocusGroupFormComponent),
        data: { title: 'Editar Focus Group' }
      },
      {
        path: 'ver/:id',
        loadComponent: () => import('./pages/focus-group-dashboard/focus-group-dashboard')
          .then(m => m.FocusGroupDashboardComponent),
        data: { title: 'Detalle Focus Group' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FocusGroupRoutingModule { }