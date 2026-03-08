// src/app/features/stakeholders/pages/stakeholder-form/stakeholder-form.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StakeholderService, StakeholderCreate } from '../../../../core/services/stakeholder.service';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

@Component({
  selector: 'app-stakeholder-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stakeholder-form.html',
  styleUrls: ['./stakeholder-form.css']
})
export class StakeholderFormComponent implements OnInit {

  stakeholder: StakeholderCreate = {
    proyecto_id: null,
    nombre: '',
    rol: '',
    tipo: '',
    area: '',
    nivel_influencia: '',
    interes_sistema: ''
  };

  showSuccess = false;
  showError   = false;
  errorMessage = '';
  isSubmitting = false;

  proyectoId: number | null = null;
  proyectoNombre = '';

  constructor(
    private stakeholderService: StakeholderService,
    private proyectoActivoSvc: ProyectoActivoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ← Leer proyecto activo del servicio (no de queryParams)
    this.proyectoId = this.proyectoActivoSvc.proyectoId;
    this.proyectoNombre = this.proyectoActivoSvc.proyecto?.nombre ?? '';
    this.stakeholder.proyecto_id = this.proyectoId;
  }

  onSubmit() {
    if (!this.isFormValid() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.showError = false;

    const payload: StakeholderCreate = {
      ...this.stakeholder,
      proyecto_id: this.proyectoId   // ← siempre del servicio activo
    };

    this.stakeholderService.createStakeholder(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess = true;
        this.resetForm();
        setTimeout(() => {
          this.showSuccess = false;
          this.router.navigate(['/elicitacion']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError = true;
        this.errorMessage = err?.error?.detail || 'Error al guardar el stakeholder';
        setTimeout(() => this.showError = false, 5000);
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.stakeholder.nombre &&
      this.stakeholder.rol &&
      this.stakeholder.tipo &&
      this.stakeholder.area &&
      this.stakeholder.nivel_influencia &&
      this.stakeholder.interes_sistema
    );
  }

  resetForm() {
    this.stakeholder = {
      proyecto_id: this.proyectoId,
      nombre: '',
      rol: '',
      tipo: '',
      area: '',
      nivel_influencia: '',
      interes_sistema: ''
    };
  }
}