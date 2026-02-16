
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface Aspectos {
  interaccionInterfaz: boolean;
  tiempoRespuesta: boolean;
  erroresDificultades: boolean;
  patronesNavegacion: boolean;
  usoFuncionalidades: boolean;
  reaccionesUsuario: boolean;
}

export interface DatosGenerales {
  usuarioObservado: string;
  area: string;
  fecha: string;
  lugarSistema: string;
}

export interface Observacion {
  id?: string;
  fecha: string;
  lugar: string;
  perfilUsuario: string;
  aspectos: Aspectos;
  datosGenerales: DatosGenerales;
  conclusiones: string;
  fechaCreacion?: Date;
}

@Component({
  selector: 'app-observacion-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './observacion-form.html',
  styleUrls: ['./observacion-form.css']
})
export class ObservacionFormComponent {
  // Nueva observación para agregar
  nuevaObservacion: Observacion = {
    fecha: '',
    lugar: '',
    perfilUsuario: '',
    aspectos: {
      interaccionInterfaz: false,
      tiempoRespuesta: false,
      erroresDificultades: false,
      patronesNavegacion: false,
      usoFuncionalidades: false,
      reaccionesUsuario: false
    },
    datosGenerales: {
      usuarioObservado: '',
      area: '',
      fecha: '',
      lugarSistema: ''
    },
    conclusiones: ''
  };

  // Lista de observaciones
  observaciones: Observacion[] = [];

  // Mensaje de éxito
  showSuccess = false;
  successMessage = '';

  // Estado del formulario de agregar
  showAddForm = false;

  // Observación en edición
  observacionEditando: Observacion | null = null;

  constructor(private router: Router) {
    this.loadObservaciones();
    this.setFechaActual();
  }

  /**
   * Establecer fecha actual por defecto
   */
  setFechaActual() {
    const today = new Date().toISOString().split('T')[0];
    this.nuevaObservacion.fecha = today;
    this.nuevaObservacion.datosGenerales.fecha = today;
  }

  /**
   * Agregar nueva observación a la lista
   */
  agregarObservacion() {
    if (this.isNuevaObservacionValid()) {
      const observacion: Observacion = {
        ...this.nuevaObservacion,
        id: this.generateId(),
        fechaCreacion: new Date()
      };

      this.observaciones.push(observacion);
      this.saveObservaciones();
      this.resetNuevaObservacion();
      this.showAddForm = false;
      this.showSuccessMessage('Observación registrada correctamente');
    }
  }

  /**
   * Eliminar observación de la lista
   */
  eliminarObservacion(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar esta observación?')) {
      this.observaciones = this.observaciones.filter(o => o.id !== id);
      this.saveObservaciones();
      this.showSuccessMessage('Observación eliminada');
    }
  }

  /**
   * Editar observación
   */
  editarObservacion(obs: Observacion) {
    this.observacionEditando = obs;
    this.nuevaObservacion = { ...obs };
    this.showAddForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Actualizar observación editada
   */
  actualizarObservacion() {
    if (this.observacionEditando && this.isNuevaObservacionValid()) {
      const index = this.observaciones.findIndex(o => o.id === this.observacionEditando!.id);
      if (index !== -1) {
        this.observaciones[index] = {
          ...this.nuevaObservacion,
          id: this.observacionEditando.id,
          fechaCreacion: this.observacionEditando.fechaCreacion
        };
        this.saveObservaciones();
        this.resetNuevaObservacion();
        this.showAddForm = false;
        this.observacionEditando = null;
        this.showSuccessMessage('Observación actualizada correctamente');
      }
    }
  }

  /**
   * Guardar todos los cambios
   */
  guardarCambios() {
    this.saveObservaciones();
    this.showSuccessMessage('Cambios guardados exitosamente');
  }

  /**
   * Validar nueva observación
   */
  isNuevaObservacionValid(): boolean {
    return !!(
      this.nuevaObservacion.fecha &&
      this.nuevaObservacion.lugar &&
      this.nuevaObservacion.perfilUsuario &&
      this.nuevaObservacion.conclusiones &&
      this.nuevaObservacion.datosGenerales.usuarioObservado &&
      this.nuevaObservacion.datosGenerales.area &&
      this.nuevaObservacion.datosGenerales.fecha &&
      this.nuevaObservacion.datosGenerales.lugarSistema
    );
  }

  /**
   * Resetear formulario de nueva observación
   */
  resetNuevaObservacion() {
    const today = new Date().toISOString().split('T')[0];
    this.nuevaObservacion = {
      fecha: today,
      lugar: '',
      perfilUsuario: '',
      aspectos: {
        interaccionInterfaz: false,
        tiempoRespuesta: false,
        erroresDificultades: false,
        patronesNavegacion: false,
        usoFuncionalidades: false,
        reaccionesUsuario: false
      },
      datosGenerales: {
        usuarioObservado: '',
        area: '',
        fecha: today,
        lugarSistema: ''
      },
      conclusiones: ''
    };
    this.observacionEditando = null;
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
    return `OBS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guardar en localStorage
   */
  private saveObservaciones() {
    try {
      localStorage.setItem('srs_observaciones', JSON.stringify(this.observaciones));
    } catch (error) {
      console.error('Error al guardar observaciones:', error);
    }
  }

  /**
   * Cargar desde localStorage
   */
  private loadObservaciones() {
    try {
      const stored = localStorage.getItem('srs_observaciones');
      if (stored) {
        this.observaciones = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar observaciones:', error);
    }
  }

  /**
   * Exportar a JSON
   */
  exportarJSON() {
    const dataStr = JSON.stringify(this.observaciones, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `observaciones-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.showSuccessMessage('Archivo exportado correctamente');
  }

  /**
   * Contar aspectos seleccionados
   */
  contarAspectosSeleccionados(aspectos: Aspectos): number {
    return Object.values(aspectos).filter(valor => valor === true).length;
  }

  /**
   * Obtener nombres de aspectos seleccionados
   */
  obtenerAspectosSeleccionados(aspectos: Aspectos): string[] {
    const nombres = [];
    if (aspectos.interaccionInterfaz) nombres.push('Interacción con interfaz');
    if (aspectos.tiempoRespuesta) nombres.push('Tiempo de respuesta');
    if (aspectos.erroresDificultades) nombres.push('Errores encontrados');
    if (aspectos.patronesNavegacion) nombres.push('Patrones de navegación');
    if (aspectos.usoFuncionalidades) nombres.push('Uso de funcionalidades');
    if (aspectos.reaccionesUsuario) nombres.push('Reacciones del usuario');
    return nombres;
  }
}