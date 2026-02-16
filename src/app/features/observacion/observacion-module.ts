import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObservacionRoutingModule } from './observacion-routing.module';
import { ObservacionFormComponent } from './pages/observacion-form/observacion-form';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ObservacionRoutingModule,
    ObservacionFormComponent
  ]
})
export class ObservacionModule { }