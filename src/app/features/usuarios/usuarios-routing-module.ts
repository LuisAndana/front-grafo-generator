import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosFormComponent } from './pages/usuarios-form/usuarios-form';

const routes: Routes = [
  {
    path: '',
    component: UsuariosFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsuariosRoutingModule { }