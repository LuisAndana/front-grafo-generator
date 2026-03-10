// src/app/features/requerimientos/pages/rf/rf.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule }        from '@angular/material/card';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatTableModule }       from '@angular/material/table';
import { MatChipsModule }       from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { RequerimientoFuncionalService, RF, Prioridad, EstadoRF } from '../../../../core/services/requerimiento-funcional.service';
import { ProyectoActivoService }         from '../../../../core/services/proyecto-activo.service';
import { ConfirmarEliminarDialogComponent } from './confirmar-eliminar-dialog.component';

@Component({
  selector: 'app-rf',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './rf.html',
  styleUrls: ['./rf.css']
})
export class Rf implements OnInit {

  constructor(
    private rfService:         RequerimientoFuncionalService,
    private proyectoActivoSvc: ProyectoActivoService,
    private cdr:               ChangeDetectorRef,
    private dialog:            MatDialog,
  ) {}

  proyectoId: number | null = null;

  // Formulario — nombres alineados con el HTML (mostrar mayúsculas al usuario)
  descripcion: string = '';
  actor:       string = '';
  prioridad:   Prioridad = 'Alta';
  estado:      EstadoRF  = 'Borrador';
  editandoId:  number | null = null;

  // Lista
  requerimientos: RF[] = [];
  columnas = ['codigo', 'descripcion', 'actor', 'prioridad', 'estado', 'acciones'];

  // Estado UI — nombres que usa el HTML
  cargando  = false;
  guardando = false;
  errorMsg  = '';

  // ════════════════════════════════════════════════
  ngOnInit(): void {
    this.proyectoId = this.proyectoActivoSvc.proyectoId;
    
    if (this.proyectoId) {
      this.cargarRFs();
    } else {
      console.warn('No hay proyecto activo');
    }
  }

  /**
   * Carga todos los RF del proyecto actual desde la BD
   */
  cargarRFs(): void {
    if (!this.proyectoId) return;

    this.cargando = true;
    this.rfService.listar(this.proyectoId).subscribe({
      next: (data: RF[]) => {
        this.requerimientos = [...data];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando RFs:', err);
        this.errorMsg = err?.error?.detail || 'Error al cargar los requerimientos';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════
  /**
   * Agregar o actualizar RF
   */
  agregar(): void {
    if (!this.descripcion.trim() || !this.actor.trim()) {
      alert('Completa descripción y actor');
      return;
    }

    if (!this.proyectoId) {
      alert('No hay proyecto activo');
      return;
    }

    this.guardando = true;
    this.errorMsg = '';

    // Convertir a minúsculas para la BD
    const prioridadBD = this.convertirPrioridad(this.prioridad);
    const estadoBD = this.convertirEstado(this.estado);

    if (this.editandoId !== null) {
      // ACTUALIZAR
      this.rfService.actualizar(this.editandoId, {
        descripcion: this.descripcion,
        actor: this.actor,
        prioridad: prioridadBD,
        estado: estadoBD,
      }).subscribe({
        next: (rfActualizado) => {
          // Actualizar en la lista
          const index = this.requerimientos.findIndex(r => r.id_req === this.editandoId);
          if (index !== -1) {
            this.requerimientos[index] = rfActualizado;
            this.requerimientos = [...this.requerimientos];  // Refresh tabla
          }
          this.guardando = false;
          this.limpiar();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.guardando = false;
          this.errorMsg = err?.error?.detail || 'Error al actualizar';
          this.cdr.detectChanges();
        }
      });
    } else {
      // CREAR
      this.rfService.crear({
        proyecto_id: this.proyectoId,
        descripcion: this.descripcion,
        actor: this.actor,
        prioridad: prioridadBD,
        estado: estadoBD,
      }).subscribe({
        next: (nuevoRF) => {
          this.requerimientos = [...this.requerimientos, nuevoRF];
          this.guardando = false;
          this.limpiar();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.guardando = false;
          this.errorMsg = err?.error?.detail || 'Error al crear el RF';
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Convierte prioridad a minúsculas para la BD
   */
  private convertirPrioridad(valor: string): Prioridad {
    const mapa: {[key: string]: Prioridad} = {
      'Alta': 'Alta',
      'alta': 'Alta',
      'Media': 'Media',
      'media': 'Media',
      'Baja': 'Baja',
      'baja': 'Baja',
    };
    return mapa[valor]?.toLowerCase() as Prioridad || 'Media';
  }

  /**
   * Convierte estado a minúsculas para la BD
   */
  private convertirEstado(valor: string): EstadoRF {
    const mapa: {[key: string]: string} = {
      'Borrador': 'Borrador',
      'borrador': 'Borrador',
      'En progreso': 'En progreso',
      'en progreso': 'En progreso',
      'en_progreso': 'En progreso',
      'Completado': 'Completado',
      'completado': 'Completado',
    };
    const resultado = mapa[valor] || 'Borrador';
    return resultado.toLowerCase() as EstadoRF;
  }

  /**
   * Editar un RF
   */
  editar(rf: RF): void {
    this.editandoId = rf.id_req;
    this.descripcion = rf.descripcion;
    this.actor = rf.actor || '';
    this.prioridad = this.capitalizarPrioridad(rf.prioridad) as Prioridad;
    this.estado = this.capitalizarEstado(rf.estado) as EstadoRF;
  }

  /**
   * Capitaliza prioridad para mostrar
   */
  private capitalizarPrioridad(valor: string): string {
    const mapa: {[key: string]: string} = {
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja',
    };
    return mapa[valor.toLowerCase()] || 'Media';
  }

  /**
   * Capitaliza estado para mostrar
   */
  private capitalizarEstado(valor: string): string {
    const mapa: {[key: string]: string} = {
      'borrador': 'Borrador',
      'en progreso': 'En progreso',
      'completado': 'Completado',
    };
    return mapa[valor.toLowerCase()] || 'Borrador';
  }

  /**
   * Eliminar un RF - Abre dialog elegante
   */
  eliminar(rf: RF): void {
    const dialogRef = this.dialog.open(ConfirmarEliminarDialogComponent, {
      width: '400px',
      disableClose: false,
      data: { codigo: rf.codigo, descripcion: rf.descripcion }
    });

    dialogRef.afterClosed().subscribe((resultado: boolean) => {
      if (resultado) {
        this.rfService.eliminar(rf.id_req).subscribe({
          next: () => {
            this.requerimientos = this.requerimientos.filter(r => r.id_req !== rf.id_req);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error eliminando RF:', err);
            this.errorMsg = err?.error?.detail || 'Error al eliminar';
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  /**
   * Cancelar edición y limpiar formulario
   */
  cancelarEdicion(): void {
    this.limpiar();
  }

  /**
   * Limpiar formulario
   */
  limpiar(): void {
    this.descripcion = '';
    this.actor = '';
    this.prioridad = 'Alta';
    this.estado = 'Borrador';
    this.editandoId = null;
    this.errorMsg = '';
  }

  // ════════════════════════════════════════════════
  // CONTADORES
  // ════════════════════════════════════════════════

  get total(): number {
    return this.requerimientos.length;
  }

  get completados(): number {
    return this.requerimientos.filter(r => r.estado === 'Completado').length;
  }

  get enProgreso(): number {
    return this.requerimientos.filter(r => r.estado === 'En progreso').length;
  }

  get borradores(): number {
    return this.requerimientos.filter(r => r.estado === 'Borrador').length;
  }
}