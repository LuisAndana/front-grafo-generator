import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface Usuario {
  id?: string;
  nombre: string;
  rol?: string;  
  rolSistema: string;
  descripcionFunciones: string;
  permisosEsperados: string;
  fechaRegistro?: Date;
}

@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-form.html',
  styleUrls: ['./usuarios-form.css']
})
export class UsuariosFormComponent {
  usuario: Usuario = {
    nombre: '',
    rolSistema: '',
    descripcionFunciones: '',
    permisosEsperados: ''
  };

  showSuccess = false;

  // Opciones predefinidas para roles comunes
  rolesComunes = [
    'Administrador',
    'Gerente',
    'Supervisor',
    'Operador',
    'Usuario Final',
    'Consultor',
    'Soporte Técnico',
    'Otro'
  ];

  constructor(private router: Router) {}

  onSubmit() {
    if (this.isFormValid()) {
      // Aquí guardarías en un servicio
      console.log('Usuario guardado:', this.usuario);
      this.showSuccessMessage();
      this.resetForm();
    }
  }

  isFormValid(): boolean {
    return !!(
      this.usuario.nombre &&
      this.usuario.rolSistema &&
      this.usuario.descripcionFunciones &&
      this.usuario.permisosEsperados
    );
  }

  resetForm() {
    this.usuario = {
      nombre: '',
      rolSistema: '',
      descripcionFunciones: '',
      permisosEsperados: ''
    };
  }

  showSuccessMessage() {
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
    }, 3000);
  }
}