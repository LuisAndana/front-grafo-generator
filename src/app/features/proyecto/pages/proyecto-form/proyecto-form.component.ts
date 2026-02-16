import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-proyecto-form',
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class ProyectoFormComponent implements OnInit {

  proyectoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.proyectoForm = this.fb.group({
      nombre: ['', Validators.required],
      cliente: ['', Validators.required],
      organizacion: ['', Validators.required],
      descripcionProblema: ['', Validators.required],
      objetivo: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      analista: ['', Validators.required]
    });
  }

  // =============================
  // INIT
  // =============================

  ngOnInit(): void {
    this.cargarProyecto();
  }

  // =============================
  // GUARDAR
  // =============================

  guardar() {
    if (this.proyectoForm.valid) {

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(
          'proyectoData',
          JSON.stringify(this.proyectoForm.value)
        );
      }

      alert('Proyecto guardado correctamente');
      this.proyectoForm.reset();
    }
  }

  // =============================
  // CARGAR
  // =============================

  cargarProyecto() {
    if (isPlatformBrowser(this.platformId)) {

      const data = localStorage.getItem('proyectoData');

      if (!data) return;

      const parsed = JSON.parse(data);

      this.proyectoForm.patchValue({
        ...parsed,
        fechaInicio: parsed.fechaInicio ? new Date(parsed.fechaInicio) : ''
      });
    }
  }

}
