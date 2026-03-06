import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ProyectoService } from '../../../../core/services/project.service';
import { ProyectoCreate } from '../../../../core/models/project.model';


@Component({
  selector: 'app-proyecto-form',
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProyectoFormComponent implements OnInit {

  proyectoForm: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private proyectoService: ProyectoService,
    private router: Router,
  ) {
    this.proyectoForm = this.fb.group({
      // Paso 1 — Información básica
      nombre:               ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      codigo:               ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],

      // Paso 2 — Descripción
      descripcion_problema: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      objetivo_general:     ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],

      // Paso 3 — Detalles
      fecha_inicio:         ['', Validators.required],
      analista_responsable: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    });
  }

  ngOnInit(): void {}

  // ─────────────────────────────────────────────
  // NAVEGACIÓN
  // ─────────────────────────────────────────────

  nextStep(): void {
    if (this.isStepValid()) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(
          this.proyectoForm.get('nombre')?.valid &&
          this.proyectoForm.get('codigo')?.valid
        );
      case 2:
        return !!(
          this.proyectoForm.get('descripcion_problema')?.valid &&
          this.proyectoForm.get('objetivo_general')?.valid
        );
      case 3:
        return !!(
          this.proyectoForm.get('fecha_inicio')?.valid &&
          this.proyectoForm.get('analista_responsable')?.valid
        );
      default:
        return false;
    }
  }

  getTitleForStep(): string {
    const titles: Record<number, string> = {
      1: 'Fase de Incepción - Información General',
      2: 'Fase de Incepción - Descripción y Objetivos',
      3: 'Fase de Incepción - Detalles y Responsabilidades',
    };
    return titles[this.currentStep] ?? '';
  }

  // ─────────────────────────────────────────────
  // GUARDAR → POST al backend
  // ─────────────────────────────────────────────

  guardar(): void {
    if (this.proyectoForm.invalid) {
      this.marcarCamposInvalidos();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: ProyectoCreate = {
      nombre:               this.proyectoForm.value.nombre,
      codigo:               this.proyectoForm.value.codigo,
      descripcion_problema: this.proyectoForm.value.descripcion_problema,
      objetivo_general:     this.proyectoForm.value.objetivo_general,
      fecha_inicio:         this.proyectoForm.value.fecha_inicio,  // "YYYY-MM-DD"
      analista_responsable: this.proyectoForm.value.analista_responsable,
    };

    this.proyectoService.crear(payload).subscribe({
      next: (proyecto) => {
        this.isSubmitting = false;
        this.successMessage = `✓ Proyecto "${proyecto.nombre}" creado correctamente`;

        // Redirigir a Stakeholders con el ID del nuevo proyecto
        setTimeout(() => {
          this.router.navigate(['/stakeholders'], {
            queryParams: { proyecto_id: proyecto.id_proyecto }
          });
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.detail ?? 'Error al guardar el proyecto. Intente de nuevo.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // LIMPIAR
  // ─────────────────────────────────────────────

  limpiar(): void {
    if (confirm('¿Desea limpiar el formulario?')) {
      this.proyectoForm.reset();
      this.currentStep = 1;
      this.successMessage = '';
      this.errorMessage = '';
    }
  }

  // ─────────────────────────────────────────────
  // VALIDACIÓN
  // ─────────────────────────────────────────────

  isFieldInvalid(fieldName: string): boolean {
    const field = this.proyectoForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.proyectoForm.get(fieldName);
    if (!control?.errors) return '';

    if (control.hasError('required'))   return 'Este campo es obligatorio';
    if (control.hasError('minlength'))  return `Mínimo ${control.getError('minlength').requiredLength} caracteres`;
    if (control.hasError('maxlength'))  return `Máximo ${control.getError('maxlength').requiredLength} caracteres`;

    return 'Campo inválido';
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.proyectoForm.controls).forEach(key => {
      this.proyectoForm.get(key)?.markAsTouched();
    });
  }
}