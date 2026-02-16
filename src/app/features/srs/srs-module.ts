// src/app/features/srs/srs-module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SrsRoutingModule } from './srs-routing-module';
import { SrsGeneratorComponent } from './pages/srs-generator/srs-generator.component';
import { SrsGeneratorService } from './services/srs-generator.service';

@NgModule({
  declarations: [SrsGeneratorComponent],
  imports: [
    CommonModule,
    FormsModule,
    SrsRoutingModule
  ],
  providers: [SrsGeneratorService]
})
export class SrsModule { }