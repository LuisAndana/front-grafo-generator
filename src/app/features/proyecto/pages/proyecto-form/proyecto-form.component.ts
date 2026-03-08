// src/app/features/proyecto/pages/proyecto-form/proyecto-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ProyectoService } from '../../../../core/services/project.service';
import { ProyectoCreate, ProyectoUpdate } from '../../../../core/models/project.model';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

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

  // Modo edición: si hay proyecto activo
  modoEdicion = false;
  proyectoId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private proyectoService: ProyectoService,
    private proyectoActivoSvc: ProyectoActivoService,
    private router: Router,
  ) {
    this.proyectoForm = this.fb.group({
      nombre:               ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      codigo:               ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      descripcion_problema: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      objetivo_general:     ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      fecha_inicio:         ['', Validators.required],
      analista_responsable: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    });
  }

  ngOnInit(): void {
    // Si hay proyecto activo → modo edición: cargar datos del backend
    const idActivo = this.proyectoActivoSvc.proyectoId;
    if (idActivo) {
      this.modoEdicion = true;
      this.proyectoId = idActivo;
      this.cargarProyecto(idActivo);
    }
  }

  // ─────────────────────────────────────────────
  // CARGA DATOS PARA EDICIÓN
  // ─────────────────────────────────────────────

  private cargarProyecto(id: number): void {
    this.proyectoService.obtener(id).subscribe({
      next: (proyecto) => {
        this.proyectoForm.patchValue({
          nombre:               proyecto.nombre,
          codigo:               proyecto.codigo,
          descripcion_problema: proyecto.descripcion_problema,
          objetivo_general:     proyecto.objetivo_general,
          fecha_inicio:         proyecto.fecha_inicio,
          analista_responsable: proyecto.analista_responsable,
        });
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los datos del proyecto.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // NAVEGACIÓN DE PASOS
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
    const prefix = this.modoEdicion ? 'Editar Proyecto' : 'Fase de Incepción';
    const subtitles: Record<number, string> = {
      1: `${prefix} - Información General`,
      2: `${prefix} - Descripción y Objetivos`,
      3: `${prefix} - Detalles y Responsabilidades`,
    };
    return subtitles[this.currentStep] ?? '';
  }

  get tituloFormulario(): string {
    return this.modoEdicion ? 'Editar Proyecto' : 'Registro del Proyecto';
  }

  get labelBotonGuardar(): string {
    if (this.isSubmitting) return this.modoEdicion ? 'Guardando...' : 'Creando...';
    return this.modoEdicion ? 'Guardar Cambios' : 'Guardar Proyecto';
  }

  // ─────────────────────────────────────────────
  // GUARDAR: crea o actualiza según modo
  // ─────────────────────────────────────────────

  guardar(): void {
    if (this.proyectoForm.invalid) {
      this.marcarCamposInvalidos();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.proyectoForm.value;

    if (this.modoEdicion && this.proyectoId) {
      // ── EDITAR ────────────────────────────────
      const payload: ProyectoUpdate = {
        nombre:               formValue.nombre,
        codigo:               formValue.codigo,
        descripcion_problema: formValue.descripcion_problema,
        objetivo_general:     formValue.objetivo_general,
        fecha_inicio:         formValue.fecha_inicio,
        analista_responsable: formValue.analista_responsable,
      };

      this.proyectoService.actualizar(this.proyectoId, payload).subscribe({
        next: (proyecto) => {
          this.isSubmitting = false;
          this.successMessage = `✓ Proyecto "${proyecto.nombre}" actualizado correctamente`;

          // Actualizar el proyecto activo en el servicio con los nuevos datos
          this.proyectoActivoSvc.seleccionar(proyecto);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage =
            err?.error?.detail ?? 'Error al actualizar el proyecto. Intente de nuevo.';
        },
      });

    } else {
      // ── CREAR ─────────────────────────────────
      const payload: ProyectoCreate = {
        nombre:               formValue.nombre,
        codigo:               formValue.codigo,
        descripcion_problema: formValue.descripcion_problema,
        objetivo_general:     formValue.objetivo_general,
        fecha_inicio:         formValue.fecha_inicio,
        analista_responsable: formValue.analista_responsable,
      };

      this.proyectoService.crear(payload).subscribe({
        next: (proyecto) => {
          this.isSubmitting = false;
          this.successMessage = `✓ Proyecto "${proyecto.nombre}" creado correctamente`;

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
  }

  // ─────────────────────────────────────────────
  // LIMPIAR / RESTAURAR
  // ─────────────────────────────────────────────

  limpiar(): void {
    if (this.modoEdicion) {
      // En edición: restaurar datos originales del backend
      if (confirm('¿Descartar los cambios y volver a los datos originales?')) {
        this.cargarProyecto(this.proyectoId!);
        this.currentStep = 1;
        this.successMessage = '';
        this.errorMessage = '';
      }
    } else {
      if (confirm('¿Desea limpiar el formulario?')) {
        this.proyectoForm.reset();
        this.currentStep = 1;
        this.successMessage = '';
        this.errorMessage = '';
      }
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