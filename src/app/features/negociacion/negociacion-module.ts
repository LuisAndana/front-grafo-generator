import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NegociacionFormComponent } from './pages/negociacion-form/negociacion-form';

const routes: Routes = [
  {
    path: '',
    component: NegociacionFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NegociacionRoutingModule { }