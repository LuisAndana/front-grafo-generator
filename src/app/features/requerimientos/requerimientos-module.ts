import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Rf } from './pages/rf/rf';
import { Rnf } from './pages/rnf/rnf';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'rf',
    pathMatch: 'full'
  },
  {
    path: 'rf',
    component: Rf
  },
  {
    path: 'rnf',
    component: Rnf
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RequerimientosRoutingModule {}
