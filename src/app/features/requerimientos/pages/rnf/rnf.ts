// src/app/features/requerimientos/pages/rnf/rnf.ts
import { Component, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RequerimientoNoFuncionalService, RNF } from '../../../../core/services/requerimiento-no-funcional.service';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

@Component({
  selector: 'app-rnf',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './rnf.html',
  styleUrls: ['./rnf.css']
})
export class Rnf implements OnInit {

  constructor(
    private rnfService: RequerimientoNoFuncionalService,
    private proyectoActivoSvc: ProyectoActivoService,
    private cdr: ChangeDetectorRef,
  ) {}

  // Variables de proyecto
  proyectoId: number | null = null;

  // Formulario
  tipo: string = '';
  descripcion: string = '';
  metrica: string = '';
  editandoId: number | null = null;

  // Lista
  rnfList: RNF[] = [];
  columnas = ['codigo', 'tipo', 'descripcion', 'metrica', 'acciones'];

  // Estado UI
  cargando = false;
  guardando = false;
  errorMsg = '';

  // ════════════════════════════════════════════════
  ngOnInit(): void {
    this.proyectoId = this.proyectoActivoSvc.proyectoId;
    
    if (this.proyectoId) {
      this.cargarRNFs();
    } else {
      console.warn('No hay proyecto activo');
    }
  }

  /**
   * Carga todos los RNF del proyecto actual
   */
  cargarRNFs(): void {
    if (!this.proyectoId) return;

    this.cargando = true;
    this.rnfService.listar(this.proyectoId).subscribe({
      next: (data: RNF[]) => {
        this.rnfList = [...data];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando RNFs:', err);
        this.errorMsg = err?.error?.detail || 'Error al cargar los requerimientos';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════
  /**
   * Agregar o actualizar RNF
   */
  agregar(): void {
    if (!this.tipo.trim() || !this.descripcion.trim()) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    if (!this.proyectoId) {
      alert('No hay proyecto activo');
      return;
    }

    this.guardando = true;
    this.errorMsg = '';

    if (this.editandoId !== null) {
      // ACTUALIZAR
      this.rnfService.actualizar(this.editandoId, {
        tipo: this.tipo,
        descripcion: this.descripcion,
        metrica: this.metrica || undefined,
      }).subscribe({
        next: (rnfActualizado) => {
          // Actualizar en la lista
          const index = this.rnfList.findIndex(r => r.id_rnf === this.editandoId);
          if (index !== -1) {
            this.rnfList[index] = rnfActualizado;
            this.rnfList = [...this.rnfList];  // Refresh tabla
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
      this.rnfService.crear({
        proyecto_id: this.proyectoId,
        tipo: this.tipo,
        descripcion: this.descripcion,
        metrica: this.metrica || undefined,
      }).subscribe({
        next: (nuevoRNF) => {
          this.rnfList = [...this.rnfList, nuevoRNF];
          this.guardando = false;
          this.limpiar();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.guardando = false;
          this.errorMsg = err?.error?.detail || 'Error al crear el RNF';
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Editar un RNF
   */
  editar(rnf: RNF): void {
    this.editandoId = rnf.id_rnf;
    this.tipo = rnf.tipo;
    this.descripcion = rnf.descripcion;
    this.metrica = rnf.metrica || '';
  }

  /**
   * Eliminar un RNF
   */
  eliminar(rnf: RNF): void {
    if (!confirm(`¿Eliminar el requerimiento ${rnf.codigo}?`)) {
      return;
    }

    this.rnfService.eliminar(rnf.id_rnf).subscribe({
      next: () => {
        this.rnfList = this.rnfList.filter(r => r.id_rnf !== rnf.id_rnf);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error eliminando RNF:', err);
        this.errorMsg = err?.error?.detail || 'Error al eliminar';
        this.cdr.detectChanges();
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
    this.tipo = '';
    this.descripcion = '';
    this.metrica = '';
    this.editandoId = null;
    this.errorMsg = '';
  }

  // ════════════════════════════════════════════════
  // CONTADORES
  // ════════════════════════════════════════════════

  get total(): number {
    return this.rnfList.length;
  }

  get porTipo(): { [key: string]: number } {
    const conteo: { [key: string]: number } = {};
    this.rnfList.forEach(rnf => {
      conteo[rnf.tipo] = (conteo[rnf.tipo] || 0) + 1;
    });
    return conteo;
  }
}