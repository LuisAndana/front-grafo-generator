import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-proyecto-form',
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ProyectoFormComponent implements OnInit {

  proyectoForm: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.proyectoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      cliente: ['', [Validators.required, Validators.minLength(2)]],
      organizacion: ['', [Validators.required, Validators.minLength(2)]],
      descripcionProblema: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      objetivo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      fechaInicio: ['', Validators.required],
      analista: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.cargarProyecto();
  }

  // =============================
  // NAVEGACIÓN DE PASOS
  // =============================

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

  /**
   * Validar si el paso actual es válido
   */
  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        // Validar paso 1
        return !!(this.proyectoForm.get('nombre')?.valid && 
               this.proyectoForm.get('cliente')?.valid && 
               this.proyectoForm.get('organizacion')?.valid);
      case 2:
        // Validar paso 2
        return !!(this.proyectoForm.get('descripcionProblema')?.valid && 
               this.proyectoForm.get('objetivo')?.valid);
      case 3:
        // Validar paso 3
        return !!(this.proyectoForm.get('fechaInicio')?.valid && 
               this.proyectoForm.get('analista')?.valid);
      default:
        return false;
    }
  }

  /**
   * Obtener el título para el paso actual
   */
  getTitleForStep(): string {
    switch (this.currentStep) {
      case 1:
        return 'Fase de Incepción - Información General';
      case 2:
        return 'Fase de Incepción - Descripción y Objetivos';
      case 3:
        return 'Fase de Incepción - Detalles y Responsabilidades';
      default:
        return '';
    }
  }

  // =============================
  // GUARDAR
  // =============================

  guardar(): void {
    if (this.proyectoForm.invalid) {
      this.marcarCamposInvalidos();
      return;
    }

    this.isSubmitting = true;

    setTimeout(() => {
      try {
        if (isPlatformBrowser(this.platformId)) {
          const datos = this.proyectoForm.value;
          localStorage.setItem('proyectoData', JSON.stringify(datos));
        }

        this.successMessage = '✓ Proyecto guardado correctamente';
        
        setTimeout(() => {
          this.successMessage = '';
          this.resetForm();
        }, 3000);

        this.isSubmitting = false;

      } catch (error) {
        console.error('Error al guardar:', error);
        this.isSubmitting = false;
      }
    }, 500);
  }

  // =============================
  // LIMPIAR
  // =============================

  limpiar(): void {
    if (confirm('¿Desea limpiar el formulario?')) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.proyectoForm.reset();
    this.currentStep = 1;
    this.successMessage = '';
  }

  // =============================
  // CARGAR
  // =============================

  cargarProyecto(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const data = localStorage.getItem('proyectoData');
        if (data) {
          const parsed = JSON.parse(data);
          this.proyectoForm.patchValue(parsed);
        }
      } catch (error) {
        console.error('Error al cargar:', error);
      }
    }
  }

  // =============================
  // VALIDACIÓN DE CAMPOS
  // =============================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.proyectoForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.proyectoForm.get(fieldName);
    
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    return 'Campo inválido';
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.proyectoForm.controls).forEach(key => {
      const control = this.proyectoForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });
  }
}