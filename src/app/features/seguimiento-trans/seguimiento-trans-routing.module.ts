import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeguimientoTransFormComponent } from './pages/seguimiento-trans-form/seguimiento-trans-form';

const routes: Routes = [
  {
    path: '',
    component: SeguimientoTransFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SeguimientoTransRoutingModule { }