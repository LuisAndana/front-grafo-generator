// src/app/features/requerimientos/pages/rf/rf.ts
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule }       from '@angular/material/card';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatSelectModule }     from '@angular/material/select';
import { MatButtonModule }     from '@angular/material/button';
import { MatIconModule }       from '@angular/material/icon';
import { MatTableModule }      from '@angular/material/table';
import { MatChipsModule }      from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { timeout } from 'rxjs/operators';

import { RequerimientoFuncionalService } from '../../../../core/services/requerimiento-funcional.service';
import {
  RequerimientoFuncional,
  RequerimientoFuncionalCreate,
  Prioridad,
  EstadoRF,
} from '../../../../core/models/requerimiento-funcional.model';

@Component({
  selector: 'app-rf',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './rf.html',
  styleUrls: ['./rf.css'],
})
export class Rf implements OnInit {

  // ── Formulario ───────────────────────────────
  descripcion = '';
  actor       = '';
  prioridad: Prioridad = 'Media';
  estado: EstadoRF     = 'Borrador';

  /** ID del proyecto activo (puedes inyectarlo desde el estado global / route) */
  proyectoId: number | null = null;

  // ── Tabla ────────────────────────────────────
  requerimientos: RequerimientoFuncional[] = [];
  columnas = ['codigo', 'descripcion', 'actor', 'prioridad', 'estado', 'acciones'];

  // ── Estado UI ────────────────────────────────
  cargando   = false;
  guardando  = false;

  /** RF en modo edición (null = ninguno) */
  editandoId: number | null = null;

  constructor(
    private rfSvc:    RequerimientoFuncionalService,
    private snackBar: MatSnackBar,
    private cdr:      ChangeDetectorRef,
  ) {}

  // ════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════

  ngOnInit(): void {
    this.cargarRFs();
  }

  // ════════════════════════════════════════════
  // CARGA
  // ════════════════════════════════════════════

  cargarRFs(): void {
    this.cargando = true;
    this.rfSvc.listar(this.proyectoId)
      .pipe(timeout(8000))
      .subscribe({
        next: (data) => {
          this.requerimientos = [...data];
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargando = false;
          const msg = err?.name === 'TimeoutError'
            ? 'El servidor tardó demasiado. Verifica que el backend esté corriendo.'
            : 'Error al cargar requerimientos';
          this.toast(msg, 'error');
          this.cdr.detectChanges();
          console.error(err);
        },
      });
  }

  // ════════════════════════════════════════════
  // AGREGAR / ACTUALIZAR
  // ════════════════════════════════════════════

  agregar(): void {
    if (!this.descripcion.trim() || !this.actor.trim()) {
      this.toast('Completa Descripción y Actor', 'warn');
      return;
    }

    const payload: RequerimientoFuncionalCreate = {
      proyecto_id: this.proyectoId,
      descripcion: this.descripcion.trim(),
      actor:       this.actor.trim(),
      prioridad:   this.prioridad,
      estado:      this.estado,
    };

    this.guardando = true;

    if (this.editandoId !== null) {
      // ── MODO EDICIÓN ──
      this.rfSvc.actualizar(this.editandoId, payload).subscribe({
        next: (actualizado) => {
          const idx = this.requerimientos.findIndex(r => r.id_req === this.editandoId);
          if (idx !== -1) {
            this.requerimientos[idx] = actualizado;
            this.requerimientos = [...this.requerimientos];
          }
          this.guardando  = false;
          this.editandoId = null;
          this.limpiar();
          this.toast(`${actualizado.codigo} actualizado`, 'ok');
        },
        error: (err) => {
          this.guardando = false;
          this.toast('Error al actualizar', 'error');
          console.error(err);
        },
      });

    } else {
      // ── MODO CREAR ──
      this.rfSvc.crear(payload).subscribe({
        next: (nuevo) => {
          this.requerimientos = [...this.requerimientos, nuevo];
          this.guardando = false;
          this.limpiar();
          this.toast(`${nuevo.codigo} creado`, 'ok');
        },
        error: (err) => {
          this.guardando = false;
          this.toast('Error al crear requerimiento', 'error');
          console.error(err);
        },
      });
    }
  }

  // ════════════════════════════════════════════
  // EDITAR
  // ════════════════════════════════════════════

  editar(rf: RequerimientoFuncional): void {
    this.editandoId  = rf.id_req;
    this.descripcion = rf.descripcion;
    this.actor       = rf.actor ?? '';
    this.prioridad   = rf.prioridad;
    this.estado      = rf.estado;
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.limpiar();
  }

  // ════════════════════════════════════════════
  // ELIMINAR
  // ════════════════════════════════════════════

  eliminar(rf: RequerimientoFuncional): void {
    if (!confirm(`¿Eliminar ${rf.codigo}?`)) return;

    this.rfSvc.eliminar(rf.id_req).subscribe({
      next: () => {
        this.requerimientos = this.requerimientos.filter(r => r.id_req !== rf.id_req);
        this.toast(`${rf.codigo} eliminado`, 'ok');
      },
      error: (err) => {
        this.toast('Error al eliminar', 'error');
        console.error(err);
      },
    });
  }

  // ════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════

  limpiar(): void {
    this.descripcion = '';
    this.actor       = '';
    this.prioridad   = 'Media';
    this.estado      = 'Borrador';
  }

  private toast(msg: string, tipo: 'ok' | 'warn' | 'error'): void {
    const panelClass =
      tipo === 'ok'    ? ['snack-ok']    :
      tipo === 'warn'  ? ['snack-warn']  :
                         ['snack-error'];
    this.snackBar.open(msg, '✕', { duration: 3000, panelClass });
  }

  // ════════════════════════════════════════════
  // CONTADORES
  // ════════════════════════════════════════════

  get total()      { return this.requerimientos.length; }
  get completados(){ return this.requerimientos.filter(r => r.estado === 'Completado').length; }
  get enProgreso() { return this.requerimientos.filter(r => r.estado === 'En progreso').length; }
  get borradores() { return this.requerimientos.filter(r => r.estado === 'Borrador').length; }
}