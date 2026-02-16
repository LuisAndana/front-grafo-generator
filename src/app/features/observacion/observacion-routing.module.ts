import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ObservacionFormComponent } from './pages/observacion-form/observacion-form';

const routes: Routes = [
  {
    path: '',
    component: ObservacionFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ObservacionRoutingModule { }