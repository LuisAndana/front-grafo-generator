import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ValidacionCliente } from './pages/validacion-cliente/validacion-cliente';

const routes: Routes = [
  {
    path: '',
    component: ValidacionCliente
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValidacionRoutingModule { }
