import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StakeholderService, StakeholderCreate } from '../../../../core/services/stakeholder.service';

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
  showError = false;
  errorMessage = '';
  isSubmitting = false;

  proyectoId: number | null = null;

  constructor(
    private stakeholderService: StakeholderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['proyecto_id']) {
        this.proyectoId = Number(params['proyecto_id']);
        this.stakeholder.proyecto_id = this.proyectoId;
      }
    });
  }

  onSubmit() {
    if (!this.isFormValid() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.showError = false;

    const payload: StakeholderCreate = {
      ...this.stakeholder,
      proyecto_id: this.proyectoId
    };

    this.stakeholderService.createStakeholder(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess = true;

        // Redirigir a Elicitación después de 1.5 segundos
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