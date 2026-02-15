import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface Requerimiento {
  id?: string;
  nombre: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja' | '';
  aceptado: boolean;
  fechaCreacion?: Date;
}

@Component({
  selector: 'app-negociacion-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './negociacion-form.html',
  styleUrls: ['./negociacion-form.css']
})
export class NegociacionFormComponent {
  // Nuevo requerimiento para agregar
  nuevoRequerimiento: Requerimiento = {
    nombre: '',
    descripcion: '',
    prioridad: '',
    aceptado: false
  };

  // Lista de requerimientos
  requerimientos: Requerimiento[] = [];

  // Mensaje de éxito
  showSuccess = false;
  successMessage = '';

  // Estado del formulario de agregar
  showAddForm = false;

  constructor(private router: Router) {
    this.loadRequerimientos();
  }

  /**
   * Agregar nuevo requerimiento a la tabla
   */
  agregarRequerimiento() {
    if (this.isNuevoRequerimientoValid()) {
      const requerimiento: Requerimiento = {
        ...this.nuevoRequerimiento,
        id: this.generateId(),
        fechaCreacion: new Date()
      };

      this.requerimientos.push(requerimiento);
      this.saveRequerimientos();
      this.resetNuevoRequerimiento();
      this.showAddForm = false;
      this.showSuccessMessage('Requerimiento agregado correctamente');
    }
  }

  /**
   * Eliminar requerimiento de la tabla
   */
  eliminarRequerimiento(id: string) {
    this.requerimientos = this.requerimientos.filter(r => r.id !== id);
    this.saveRequerimientos();
    this.showSuccessMessage('Requerimiento eliminado');
  }

  /**
   * Actualizar prioridad de un requerimiento
   */
  actualizarPrioridad(id: string, prioridad: string) {
    const req = this.requerimientos.find(r => r.id === id);
    if (req) {
      req.prioridad = prioridad as 'Alta' | 'Media' | 'Baja';
      this.saveRequerimientos();
    }
  }

  /**
   * Actualizar estado de aceptación
   */
  actualizarAceptado(id: string, aceptado: boolean) {
    const req = this.requerimientos.find(r => r.id === id);
    if (req) {
      req.aceptado = aceptado;
      this.saveRequerimientos();
    }
  }

  /**
   * Guardar todos los requerimientos
   */
  guardarCambios() {
    this.saveRequerimientos();
    this.showSuccessMessage('Cambios guardados exitosamente');
  }

  /**
   * Obtener requerimientos por prioridad
   */
  getRequerimientosPorPrioridad(prioridad: string): Requerimiento[] {
    return this.requerimientos.filter(r => r.prioridad === prioridad);
  }

  /**
   * Obtener requerimientos aceptados
   */
  getRequerimientosAceptados(): Requerimiento[] {
    return this.requerimientos.filter(r => r.aceptado);
  }

  /**
   * Validar nuevo requerimiento
   */
  isNuevoRequerimientoValid(): boolean {
    return !!(
      this.nuevoRequerimiento.nombre &&
      this.nuevoRequerimiento.descripcion &&
      this.nuevoRequerimiento.prioridad
    );
  }

  /**
   * Resetear formulario de nuevo requerimiento
   */
  resetNuevoRequerimiento() {
    this.nuevoRequerimiento = {
      nombre: '',
      descripcion: '',
      prioridad: '',
      aceptado: false
    };
  }

  /**
   * Mostrar mensaje de éxito
   */
  showSuccessMessage(message: string) {
    this.successMessage = message;
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
    }, 3000);
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guardar en localStorage
   */
  private saveRequerimientos() {
    try {
      localStorage.setItem('srs_requerimientos_negociacion', JSON.stringify(this.requerimientos));
    } catch (error) {
      console.error('Error al guardar requerimientos:', error);
    }
  }

  /**
   * Cargar desde localStorage
   */
  private loadRequerimientos() {
    try {
      const stored = localStorage.getItem('srs_requerimientos_negociacion');
      if (stored) {
        this.requerimientos = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar requerimientos:', error);
    }
  }

  /**
   * Exportar a JSON
   */
  exportarJSON() {
    const dataStr = JSON.stringify(this.requerimientos, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `requerimientos-negociacion-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.showSuccessMessage('Archivo exportado correctamente');
  }
}