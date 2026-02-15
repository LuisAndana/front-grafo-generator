import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StakeholderService, Stakeholder } from '../../../../core/services/stakeholder.service';

@Component({
  selector: 'app-stakeholder-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stakeholder-form.html',
  styleUrls: ['./stakeholder-form.css']
})
export class StakeholderFormComponent {
  stakeholder: Stakeholder = {
    nombre: '',
    rol: '',
    tipo: '',
    area: '',
    nivelInfluencia: '',
    interesSistema: ''
  };

  showSuccess = false;

  constructor(
    private stakeholderService: StakeholderService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.isFormValid()) {
      this.stakeholderService.saveStakeholder(this.stakeholder);
      this.showSuccessMessage();
      this.resetForm();
      
      // Opcional: redirigir a lista después de 2 segundos
      // setTimeout(() => {
      //   this.router.navigate(['/stakeholders/list']);
      // }, 2000);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.stakeholder.nombre &&
      this.stakeholder.rol &&
      this.stakeholder.tipo &&
      this.stakeholder.area &&
      this.stakeholder.nivelInfluencia &&
      this.stakeholder.interesSistema
    );
  }

  resetForm() {
    this.stakeholder = {
      nombre: '',
      rol: '',
      tipo: '',
      area: '',
      nivelInfluencia: '',
      interesSistema: ''
    };
  }

  showSuccessMessage() {
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
    }, 3000);
  }
}