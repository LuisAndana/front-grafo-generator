import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { FocusGroupRoutingModule } from './focus-group-routing.module';
import { FocusGroupService } from '../../core/services/focus-group.service';

@NgModule({
  declarations: [
    // Aquí irán los componentes cuando los crees
    // FocusGroupDashboardComponent,
    // FocusGroupFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    FocusGroupRoutingModule
  ],
  providers: [FocusGroupService]
})
export class FocusGroupModule { }