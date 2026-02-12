import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProyectoFormComponent } from './pages/proyecto-form/proyecto-form.component';

const routes: Routes = [
  {
    path: '',
    component: ProyectoFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProyectoRoutingModule { }
