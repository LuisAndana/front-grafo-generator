import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface PasoProceso {
  descripcion: string;
  observaciones: string;
}

export interface SeguimientoTransaccional {
  id?: string;
  usuarioObservado: string;
  areaRol: string;
  fecha: string;
  lugarSistema: string;
  objetivoProceso: string;
  pasos: PasoProceso[];
  conclusiones: string;
  fechaCreacion?: Date;
}

@Component({
  selector: 'app-seguimiento-trans-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento-trans-form.html',
  styleUrls: ['./seguimiento-trans-form.css']
})
export class SeguimientoTransFormComponent {
  // Nuevo seguimiento para agregar
  nuevoSeguimiento: SeguimientoTransaccional = {
    usuarioObservado: '',
    areaRol: '',
    fecha: '',
    lugarSistema: '',
    objetivoProceso: '',
    pasos: [
      { descripcion: '', observaciones: '' }
    ],
    conclusiones: ''
  };

  // Lista de seguimientos
  seguimientos: SeguimientoTransaccional[] = [];

  // Mensaje de éxito
  showSuccess = false;
  successMessage = '';

  // Estado del formulario de agregar
  showAddForm = false;

  // Seguimiento en edición
  seguimientoEditando: SeguimientoTransaccional | null = null;

  constructor(private router: Router) {
    this.loadSeguimientos();
    this.setFechaActual();
  }

  /**
   * Establecer fecha actual por defecto
   */
  setFechaActual() {
    const today = new Date().toISOString().split('T')[0];
    this.nuevoSeguimiento.fecha = today;
  }

  /**
   * Agregar nuevo paso al proceso
   */
  agregarPaso() {
    this.nuevoSeguimiento.pasos.push({
      descripcion: '',
      observaciones: ''
    });
  }

  /**
   * Eliminar un paso del proceso
   */
  eliminarPaso(index: number) {
    if (this.nuevoSeguimiento.pasos.length > 1) {
      this.nuevoSeguimiento.pasos.splice(index, 1);
    }
  }

  /**
   * Guardar nuevo seguimiento
   */
  guardarSeguimiento() {
    if (this.seguimientoEditando) {
      this.actualizarSeguimiento();
    } else {
      this.agregarSeguimiento();
    }
  }

  /**
   * Agregar nuevo seguimiento a la lista
   */
  agregarSeguimiento() {
    if (this.isNuevoSeguimientoValid()) {
      const seguimiento: SeguimientoTransaccional = {
        ...this.nuevoSeguimiento,
        id: this.generateId(),
        fechaCreacion: new Date()
      };

      this.seguimientos.push(seguimiento);
      this.saveSeguimientos();
      this.resetNuevoSeguimiento();
      this.showAddForm = false;
      this.showSuccessMessage('Seguimiento transaccional registrado correctamente');
    }
  }

  /**
   * Actualizar seguimiento editado
   */
  actualizarSeguimiento() {
    if (this.seguimientoEditando && this.isNuevoSeguimientoValid()) {
      const index = this.seguimientos.findIndex(s => s.id === this.seguimientoEditando!.id);
      if (index !== -1) {
        this.seguimientos[index] = {
          ...this.nuevoSeguimiento,
          id: this.seguimientoEditando.id,
          fechaCreacion: this.seguimientoEditando.fechaCreacion
        };
        this.saveSeguimientos();
        this.resetNuevoSeguimiento();
        this.showAddForm = false;
        this.seguimientoEditando = null;
        this.showSuccessMessage('Seguimiento actualizado correctamente');
      }
    }
  }

  /**
   * Editar seguimiento existente
   */
  editarSeguimiento(seg: SeguimientoTransaccional) {
    this.seguimientoEditando = seg;
    this.nuevoSeguimiento = JSON.parse(JSON.stringify(seg)); // Deep copy
    this.showAddForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Eliminar seguimiento de la lista
   */
  eliminarSeguimiento(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este seguimiento transaccional?')) {
      this.seguimientos = this.seguimientos.filter(s => s.id !== id);
      this.saveSeguimientos();
      this.showSuccessMessage('Seguimiento eliminado');
    }
  }

  /**
   * Cancelar formulario
   */
  cancelarFormulario() {
    this.resetNuevoSeguimiento();
    this.showAddForm = false;
    this.seguimientoEditando = null;
  }

  /**
   * Guardar todos los cambios
   */
  guardarCambios() {
    this.saveSeguimientos();
    this.showSuccessMessage('Cambios guardados exitosamente');
  }

  /**
   * Validar nuevo seguimiento
   */
  isNuevoSeguimientoValid(): boolean {
    const pasosValidos = this.nuevoSeguimiento.pasos.every(paso => 
      paso.descripcion.trim() !== ''
    );

    return !!(
      this.nuevoSeguimiento.usuarioObservado &&
      this.nuevoSeguimiento.areaRol &&
      this.nuevoSeguimiento.fecha &&
      this.nuevoSeguimiento.lugarSistema &&
      this.nuevoSeguimiento.objetivoProceso &&
      this.nuevoSeguimiento.pasos.length > 0 &&
      pasosValidos
    );
  }

  /**
   * Resetear formulario de nuevo seguimiento
   */
  resetNuevoSeguimiento() {
    const today = new Date().toISOString().split('T')[0];
    this.nuevoSeguimiento = {
      usuarioObservado: '',
      areaRol: '',
      fecha: today,
      lugarSistema: '',
      objetivoProceso: '',
      pasos: [
        { descripcion: '', observaciones: '' }
      ],
      conclusiones: ''
    };
    this.seguimientoEditando = null;
  }

  /**
   * Obtener total de pasos en todos los seguimientos
   */
  getTotalPasos(): number {
    return this.seguimientos.reduce((total, seg) => total + seg.pasos.length, 0);
  }

  /**
   * Obtener seguimientos de los últimos 7 días
   */
  getSeguimientosRecientes(): number {
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
    
    return this.seguimientos.filter(seg => {
      const fechaSeg = new Date(seg.fecha);
      return fechaSeg >= haceUnaSemana;
    }).length;
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
    return `SEG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guardar en localStorage
   */
  private saveSeguimientos() {
    try {
      localStorage.setItem('srs_seguimientos_transaccionales', JSON.stringify(this.seguimientos));
    } catch (error) {
      console.error('Error al guardar seguimientos:', error);
    }
  }

  /**
   * Cargar desde localStorage
   */
  private loadSeguimientos() {
    try {
      const stored = localStorage.getItem('srs_seguimientos_transaccionales');
      if (stored) {
        this.seguimientos = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar seguimientos:', error);
    }
  }

  /**
   * Exportar a JSON
   */
  exportarJSON() {
    const dataStr = JSON.stringify(this.seguimientos, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `seguimientos-transaccionales-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.showSuccessMessage('Archivo exportado correctamente');
  }
}