import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialService, HistorialAccion } from '../../../../core/services/historial.service';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

@Component({
  standalone: true,
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css'],
  imports: [CommonModule]
})
export class HistorialComponent implements OnInit {

  proyectoId: number | null = null;
  proyectoNombre = '';

  historial: HistorialAccion[] = [];
  historialFiltrado: HistorialAccion[] = [];
  expandedId: number | string | null = null;

  // Filtros
  filtroModulo = 'Todos';
  modulos: string[] = ['Todos'];

  // Estados
  isLoading         = false;
  isCreatingSnapshot = false;
  isClearing        = false;
  successMsg        = '';
  errorMsg          = '';
  mostrarConfirmLimpiar = false;

  constructor(
    private historialService: HistorialService,
    private proyectoActivoSvc: ProyectoActivoService
  ) {}

  ngOnInit(): void {
    this.proyectoId    = this.proyectoActivoSvc.proyectoId;
    this.proyectoNombre = this.proyectoActivoSvc.proyecto?.nombre ?? '';
    if (this.proyectoId) this.cargarHistorial();
  }

  // ── Carga ──────────────────────────────────────────────────────────────────

  cargarHistorial(): void {
    if (!this.proyectoId) return;

    this.isLoading = true;
    this.historialService.obtenerHistorial(this.proyectoId).subscribe({
      next: (data) => {
        this.historial = data;
        this.construirFiltrosModulo();
        this.aplicarFiltro();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Filtros ────────────────────────────────────────────────────────────────

  private construirFiltrosModulo(): void {
    const unicos = [...new Set(this.historial.map(h => h.modulo).filter(Boolean))];
    this.modulos = ['Todos', ...unicos];
  }

  setFiltro(modulo: string): void {
    this.filtroModulo = modulo;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    this.historialFiltrado = this.filtroModulo === 'Todos'
      ? [...this.historial]
      : this.historial.filter(h => h.modulo === this.filtroModulo);
  }

  contarPorModulo(modulo: string): number {
    if (modulo === 'Todos') return this.historial.length;
    return this.historial.filter(h => h.modulo === modulo).length;
  }

  // ── Toggle detalle ─────────────────────────────────────────────────────────

  toggle(item: HistorialAccion): void {
    const id = item.id_historial ?? item.id ?? null;
    this.expandedId = this.expandedId === id ? null : id;
  }

  isExpanded(item: HistorialAccion): boolean {
    const id = item.id_historial ?? item.id ?? null;
    return this.expandedId === id;
  }

  // ── Snapshot ───────────────────────────────────────────────────────────────

  crearRespaldo(): void {
    if (!this.proyectoId || this.isCreatingSnapshot) return;

    this.isCreatingSnapshot = true;
    this.errorMsg = '';

    this.historialService.crearSnapshot(this.proyectoId).subscribe({
      next: (nuevo) => {
        this.historial.unshift(nuevo);
        this.construirFiltrosModulo();
        this.aplicarFiltro();
        this.isCreatingSnapshot = false;
        this.successMsg = '✓ Respaldo del proyecto creado correctamente';
        setTimeout(() => { this.successMsg = ''; }, 3500);
      },
      error: (err) => {
        this.isCreatingSnapshot = false;
        this.errorMsg = err?.error?.detail ?? 'Error al crear el respaldo';
        setTimeout(() => { this.errorMsg = ''; }, 5000);
      }
    });
  }

  // ── Limpiar historial ──────────────────────────────────────────────────────

  pedirConfirmLimpiar(): void  { this.mostrarConfirmLimpiar = true; }
  cancelarLimpiar(): void      { this.mostrarConfirmLimpiar = false; }

  confirmarLimpiar(): void {
    if (!this.proyectoId) return;

    this.mostrarConfirmLimpiar = false;
    this.isClearing = true;

    this.historialService.limpiarHistorial(this.proyectoId).subscribe({
      next: () => {
        this.historial = [];
        this.historialFiltrado = [];
        this.modulos = ['Todos'];
        this.filtroModulo = 'Todos';
        this.isClearing = false;
        this.successMsg = '✓ Historial limpiado';
        setTimeout(() => { this.successMsg = ''; }, 3000);
      },
      error: () => { this.isClearing = false; }
    });
  }

  // ── Utilidades ─────────────────────────────────────────────────────────────

  getModuloColor(modulo: string): string {
    const colores: { [key: string]: string } = {
      'Snapshot':       '#6366f1',
      'SRS':            '#0ea5e9',
      'Stakeholders':   '#8b5cf6',
      'Requerimientos': '#10b981',
      'RNF':            '#f59e0b',
      'Casos de Uso':   '#06b6d4',
      'Restricciones':  '#ef4444',
      'Validación':     '#84cc16',
      'Negociación':    '#f97316',
      'Elicitación':    '#ec4899',
    };
    return colores[modulo] ?? '#6b7280';
  }

  getDetallesKeys(detalles: any): string[] {
    if (!detalles || typeof detalles !== 'object') return [];
    return Object.keys(detalles).filter(k => detalles[k] !== null && detalles[k] !== undefined);
  }

  isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }
}
