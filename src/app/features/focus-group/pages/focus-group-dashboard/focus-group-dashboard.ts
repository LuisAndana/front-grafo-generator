import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FocusGroupSession } from '../../../../core/models/focus-group.model';
import { FocusGroupService } from '../../../../core/services/focus-group.service';

@Component({
  selector: 'app-focus-group-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './focus-group-dashboard.html',
  styleUrls: ['./focus-group-dashboard.css']
})
export class FocusGroupDashboardComponent implements OnInit, OnDestroy {
  focusGroups: FocusGroupSession[] = [];
  focusGroupSeleccionado: FocusGroupSession | null = null;
  cargando = false;
  filtro_estado = 'todos';
  termino_busqueda = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private focusGroupService: FocusGroupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFocusGroups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarFocusGroups(): void {
    this.cargando = true;
    this.focusGroupService.focusGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fgs: FocusGroupSession[]) => {
          this.focusGroups = fgs;
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('Error cargando focus groups:', error);
          this.cargando = false;
        }
      });
  }

  buscar(): void {
    if (!this.termino_busqueda.trim()) {
      this.cargarFocusGroups();
      return;
    }

    this.cargando = true;
    this.focusGroupService.buscar(this.termino_busqueda)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fgs: FocusGroupSession[]) => {
          this.focusGroups = fgs;
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('Error buscando:', error);
          this.cargando = false;
        }
      });
  }

  filtrar(): void {
    if (this.filtro_estado === 'todos') {
      this.cargarFocusGroups();
      return;
    }

    this.cargando = true;
    this.focusGroupService.filtrarPorEstado(this.filtro_estado as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fgs: FocusGroupSession[]) => {
          this.focusGroups = fgs;
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('Error filtrando:', error);
          this.cargando = false;
        }
      });
  }

  irACrear(): void {
    this.router.navigate(['/focus-group/crear']);
  }

  editar(id: string): void {
    this.router.navigate(['/focus-group/editar', id]);
  }

  ver(fg: FocusGroupSession): void {
    this.focusGroupService.seleccionar(fg);
    this.router.navigate(['/focus-group/ver', fg.id]);
  }

  eliminar(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este Focus Group?')) {
      this.focusGroupService.eliminar(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargarFocusGroups();
          },
          error: (error: any) => {
            console.error('Error eliminando:', error);
            alert('Error al eliminar el Focus Group');
          }
        });
    }
  }

  get focusGroupsFiltrados(): FocusGroupSession[] {
    if (!this.termino_busqueda.trim()) {
      return this.focusGroups;
    }

    const termino = this.termino_busqueda.toUpperCase();
    return this.focusGroups.filter(fg =>
      fg.nombre_taller.toUpperCase().includes(termino) ||
      fg.moderador.toUpperCase().includes(termino) ||
      fg.ubicacion.toUpperCase().includes(termino)
    );
  }

  get estadoBadgeClase(): (estado: string) => string {
    return (estado: string) => {
      switch (estado) {
        case 'activo': return 'badge-success';
        case 'completado': return 'badge-info';
        default: return 'badge-warning';
      }
    };
  }

  estadoTexto(estado: string): string {
    const estados: Record<string, string> = {
      'borrador': 'Borrador',
      'activo': 'Activo',
      'completado': 'Completado'
    };
    return estados[estado] || '';
  }
}