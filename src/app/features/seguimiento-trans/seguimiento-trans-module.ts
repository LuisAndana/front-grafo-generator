import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguimientoTransRoutingModule } from './seguimiento-trans-routing.module';
import { SeguimientoTransFormComponent } from './pages/seguimiento-trans-form/seguimiento-trans-form';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    SeguimientoTransRoutingModule,
    SeguimientoTransFormComponent
  ]
})
export class SeguimientoTransModule { }