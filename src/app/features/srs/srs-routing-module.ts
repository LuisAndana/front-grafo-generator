// src/app/features/srs/srs-routing-module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SrsGeneratorComponent } from './pages/srs-generator/srs-generator.component';

const routes: Routes = [
  {
    path: '',
    component: SrsGeneratorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SrsRoutingModule { }