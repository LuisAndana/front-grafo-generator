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

import { RequerimientoFuncionalService } from '../../../../core/services/requerimiento-funcional.service';
import { ProyectoActivoService }         from '../../../../core/services/proyecto-activo.service';
import { Prioridad, EstadoRF }           from '../../../../core/models/requerimiento-funcional.model';

@Component({
  selector: 'app-rf',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  templateUrl: './rf.html',
  styleUrls: ['./rf.css']
})
export class Rf implements OnInit {

  constructor(
    private rfService:         RequerimientoFuncionalService,
    private proyectoActivoSvc: ProyectoActivoService,
    private cdr:               ChangeDetectorRef,
  ) {}

  proyectoId: number | null = null;

  // Formulario — nombres alineados con el HTML
  descripcion: string = '';
  actor:       string = '';
  prioridad:   Prioridad = 'Alta';
  estado:      EstadoRF  = 'Borrador';
  editandoId:  number | null = null;

  // Lista
  requerimientos: any[] = [];
  columnas = ['codigo', 'descripcion', 'actor', 'prioridad', 'estado', 'acciones'];

  // Estado UI — nombres que usa el HTML
  cargando  = false;   // ← antes isLoading
  guardando = false;   // ← antes isSaving
  errorMsg  = '';

  // ════════════════════════════════════════════════
  ngOnInit(): void {
    this.proyectoId = this.proyectoActivoSvc.proyectoId;
    this.cargarRFs();
  }

  cargarRFs(): void {
    if (!this.proyectoId) return;
    this.cargando = true;
    this.rfService.listar(this.proyectoId).subscribe({
      next: (data) => {
        this.requerimientos = [...data];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando RFs:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════
  agregar(): void {
    if (!this.descripcion.trim() || !this.actor.trim()) {
      alert('Completa descripción y actor');
      return;
    }
    if (!this.proyectoId) { alert('No hay proyecto activo'); return; }

    this.guardando = true;

    if (this.editandoId !== null) {
      // EDITAR
      this.rfService.actualizar(this.editandoId, {
        descripcion: this.descripcion,
        actor:       this.actor,
        prioridad:   this.prioridad,
        estado:      this.estado,
      }).subscribe({
        next: () => { this.guardando = false; this.limpiar(); this.cargarRFs(); },
        error: (err) => { this.guardando = false; this.errorMsg = err?.error?.detail ?? 'Error al actualizar'; }
      });
    } else {
      // CREAR
      this.rfService.crear({
        proyecto_id: this.proyectoId,
        descripcion: this.descripcion,
        actor:       this.actor,
        prioridad:   this.prioridad,
        estado:      this.estado,
      }).subscribe({
        next: (nuevo) => {
          this.guardando = false;
          this.requerimientos = [...this.requerimientos, nuevo];
          this.limpiar();
          this.cdr.detectChanges();
        },
        error: (err) => { this.guardando = false; this.errorMsg = err?.error?.detail ?? 'Error al crear el RF'; }
      });
    }
  }

  editar(rf: any): void {
    this.editandoId  = rf.id_rf;
    this.descripcion = rf.descripcion;
    this.actor       = rf.actor;
    this.prioridad   = rf.prioridad  as Prioridad;
    this.estado      = rf.estado     as EstadoRF;
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar este requerimiento?')) return;
    this.rfService.eliminar(id).subscribe({
      next: () => {
        this.requerimientos = this.requerimientos.filter(r => r.id_rf !== id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error eliminando RF:', err)
    });
  }

  // cancelarEdicion es el nombre que usa el HTML (antes solo era limpiar)
  cancelarEdicion(): void {
    this.limpiar();
  }

  limpiar(): void {
    this.descripcion = '';
    this.actor       = '';
    this.prioridad   = 'Alta';
    this.estado      = 'Borrador';
    this.editandoId  = null;
    this.errorMsg    = '';
  }

  // Contadores
  get total()       { return this.requerimientos.length; }
  get completados() { return this.requerimientos.filter(r => r.estado === 'Completado').length; }
  get enProgreso()  { return this.requerimientos.filter(r => r.estado === 'En progreso').length; }
  get borradores()  { return this.requerimientos.filter(r => r.estado === 'Borrador').length; }
}