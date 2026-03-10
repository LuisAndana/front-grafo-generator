// src/app/features/negociacion/pages/negociacion-form/negociacion-form.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NegociacionService, Negociacion } from '../../../../core/services/negociacion.service';
import { RequerimientoFuncionalService, RF } from '../../../../core/services/requerimiento-funcional.service';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

@Component({
  selector: 'app-negociacion-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './negociacion-form.html',
  styleUrls: ['./negociacion-form.css']
})
export class NegociacionFormComponent implements OnInit {
  // Datos principales
  negociaciones: Negociacion[] = [];
  requerimientosFuncionales: RF[] = [];
  proyectoId: number | null = null;

  // Formulario
  nuevoRequerimiento = {
    rf_id: '',
    prioridad: 'Media' as 'Alta' | 'Media' | 'Baja',
    aceptado: false,
    observaciones: ''
  };

  // Estado UI
  cargando = false;
  guardando = false;
  showSuccess = false;
  successMessage = '';
  showAddForm = false;
  errorMsg = '';

  constructor(
    private negociacionSvc: NegociacionService,
    private rfSvc: RequerimientoFuncionalService,
    private proyectoActivoSvc: ProyectoActivoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.proyectoId = this.proyectoActivoSvc.proyectoId;
    
    if (this.proyectoId) {
      this.cargarDatos();
    } else {
      this.errorMsg = 'No hay proyecto activo';
    }
  }

  /**
   * Cargar requerimientos funcionales y negociaciones del proyecto
   */
  private cargarDatos(): void {
    if (!this.proyectoId) return;

    this.cargando = true;

    // Cargar RFs
    this.rfSvc.listar(this.proyectoId).subscribe({
      next: (rfs) => {
        this.requerimientosFuncionales = rfs;
        // Cargar negociaciones después
        this.cargarNegociaciones();
      },
      error: (err) => {
        console.error('Error cargando RFs:', err);
        this.errorMsg = 'Error al cargar requerimientos funcionales';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cargar negociaciones del proyecto
   */
  private cargarNegociaciones(): void {
    if (!this.proyectoId) return;

    this.negociacionSvc.obtenerPorProyecto(this.proyectoId).subscribe({
      next: (negociaciones) => {
        this.negociaciones = negociaciones;
        this.negociacionSvc.setNegociaciones(negociaciones);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando negociaciones:', err);
        this.errorMsg = 'Error al cargar negociaciones';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Agregar nueva negociación
   */
  agregarNegociacion(): void {
    if (!this.nuevoRequerimiento.rf_id || !this.proyectoId) {
      alert('Selecciona un requerimiento funcional');
      return;
    }

    // Verificar que no esté duplicado
    if (this.negociaciones.some(n => n.rf_id === parseInt(this.nuevoRequerimiento.rf_id as string))) {
      alert('Este requerimiento ya está en la negociación');
      return;
    }

    this.guardando = true;

    // Obtener datos del RF seleccionado
    const rfSeleccionado = this.requerimientosFuncionales.find(
      rf => rf.id_req === parseInt(this.nuevoRequerimiento.rf_id as string)
    );

    if (!rfSeleccionado) {
      this.errorMsg = 'Requerimiento funcional no encontrado';
      this.guardando = false;
      return;
    }

    const negociacion: Negociacion = {
      proyecto_id: this.proyectoId,
      rf_id: rfSeleccionado.id_req,
      rf_codigo: rfSeleccionado.codigo,
      rf_descripcion: rfSeleccionado.descripcion,
      prioridad: this.nuevoRequerimiento.prioridad,
      aceptado: this.nuevoRequerimiento.aceptado,
      observaciones: this.nuevoRequerimiento.observaciones
    };

    this.negociacionSvc.crear(negociacion).subscribe({
      next: (nueva) => {
        this.negociaciones = [...this.negociaciones, nueva];
        this.negociacionSvc.setNegociaciones(this.negociaciones);
        this.guardando = false;
        this.resetFormulario();
        this.showAddForm = false;
        this.mostrarExito('Negociación agregada correctamente');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error agregando negociación:', err);
        this.errorMsg = err?.error?.detail || 'Error al agregar negociación';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Eliminar negociación
   */
  eliminarNegociacion(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta negociación?')) {
      return;
    }

    this.negociacionSvc.eliminar(id).subscribe({
      next: () => {
        this.negociaciones = this.negociaciones.filter(n => n.id !== id);
        this.negociacionSvc.setNegociaciones(this.negociaciones);
        this.mostrarExito('Negociación eliminada');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error eliminando negociación:', err);
        this.errorMsg = 'Error al eliminar negociación';
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualizar prioridad
   */
  actualizarPrioridad(negociacion: Negociacion): void {
    if (!negociacion.id) return;

    this.negociacionSvc.actualizarPrioridad(negociacion.id, negociacion.prioridad).subscribe({
      next: () => {
        this.mostrarExito('Prioridad actualizada');
      },
      error: (err) => {
        console.error('Error actualizando prioridad:', err);
        this.errorMsg = 'Error al actualizar prioridad';
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualizar estado de aceptación
   */
  actualizarAceptado(negociacion: Negociacion): void {
    if (!negociacion.id) return;

    this.negociacionSvc.actualizarAceptado(negociacion.id, negociacion.aceptado).subscribe({
      next: () => {
        this.mostrarExito(negociacion.aceptado ? 'Requerimiento aceptado' : 'Requerimiento rechazado');
      },
      error: (err) => {
        console.error('Error actualizando estado:', err);
        this.errorMsg = 'Error al actualizar estado';
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualizar observaciones
   */
  actualizarObservaciones(negociacion: Negociacion): void {
    if (!negociacion.id) return;

    this.negociacionSvc.actualizarObservaciones(negociacion.id, negociacion.observaciones || '').subscribe({
      next: () => {
        this.mostrarExito('Observaciones actualizadas');
      },
      error: (err) => {
        console.error('Error actualizando observaciones:', err);
        this.errorMsg = 'Error al actualizar observaciones';
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Guardar todos los cambios
   */
  guardarCambios(): void {
    this.mostrarExito('Todos los cambios han sido guardados');
  }

  /**
   * Obtener negociaciones por prioridad
   */
  getNegociacionesPorPrioridad(prioridad: 'Alta' | 'Media' | 'Baja'): Negociacion[] {
    return this.negociaciones.filter(n => n.prioridad === prioridad);
  }

  /**
   * Obtener negociaciones aceptadas
   */
  getNegociacionesAceptadas(): Negociacion[] {
    return this.negociaciones.filter(n => n.aceptado);
  }

  /**
   * Obtener RF no agregados aún
   */
  getRFsDisponibles(): RF[] {
    const idsAgregados = this.negociaciones.map(n => n.rf_id);
    return this.requerimientosFuncionales.filter(rf => !idsAgregados.includes(rf.id_req));
  }

  /**
   * Validar nuevo requerimiento
   */
  isNuevoRequerimientoValid(): boolean {
    return !!this.nuevoRequerimiento.rf_id;
  }

  /**
   * Resetear formulario
   */
  resetFormulario(): void {
    this.nuevoRequerimiento = {
      rf_id: '',
      prioridad: 'Media',
      aceptado: false,
      observaciones: ''
    };
  }

  /**
   * Mostrar mensaje de éxito
   */
  mostrarExito(mensaje: string): void {
    this.successMessage = mensaje;
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Exportar a JSON
   */
  exportarJSON(): void {
    const dataStr = JSON.stringify(this.negociaciones, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `negociaciones-${this.proyectoId}-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.mostrarExito('Archivo exportado correctamente');
  }
}