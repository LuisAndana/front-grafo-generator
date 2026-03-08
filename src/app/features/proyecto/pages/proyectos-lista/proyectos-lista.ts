// src/app/features/proyectos/pages/proyectos-lista/proyectos-lista.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProyectoActivoService, ProyectoResumen } from '../../../../core/services/proyecto-activo.service';

@Component({
  selector: 'app-proyectos-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyectos-lista.html',
  styleUrls: ['./proyectos-lista.css'],
})
export class ProyectosLista implements OnInit {

  proyectos: ProyectoResumen[] = [];
  cargando    = false;
  mostrarForm = false;
  guardando   = false;
  error       = '';

  // ── formulario nuevo proyecto ──
  form = {
    nombre: '',
    codigo: '',
    descripcion_problema: '',
    objetivo_general: '',
    fecha_inicio: '',
    analista_responsable: '',
  };

  // ── confirmación eliminar ──
  proyectoAEliminar: ProyectoResumen | null = null;

  constructor(
    private http:            HttpClient,
    private router:          Router,
    private proyectoActivo:  ProyectoActivoService,
    private cdr:             ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
  }

  // ════════════════════════════════════════════
  // CARGA
  // ════════════════════════════════════════════

  cargarProyectos(): void {
    this.cargando = true;
    this.http.get<ProyectoResumen[]>('http://localhost:8000/proyectos/').subscribe({
      next: (data) => {
        this.proyectos = data;
        this.cargando  = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.error    = 'Error al cargar proyectos';
        this.cdr.detectChanges();
      },
    });
  }

  // ════════════════════════════════════════════
  // SELECCIONAR → ENTRAR AL PROYECTO
  // ════════════════════════════════════════════

  entrar(proyecto: ProyectoResumen): void {
    this.proyectoActivo.seleccionar(proyecto);
    this.router.navigate(['/proyecto']);   // va al módulo Proyecto (edición)
  }

  // ════════════════════════════════════════════
  // CREAR PROYECTO
  // ════════════════════════════════════════════

  abrirForm(): void {
    this.mostrarForm = true;
    this.limpiarForm();
  }

  cerrarForm(): void {
    this.mostrarForm = false;
    this.limpiarForm();
  }

  crear(): void {
    if (!this.formValido()) return;

    this.guardando = true;
    this.http.post<ProyectoResumen>('http://localhost:8000/proyectos/', this.form).subscribe({
      next: (nuevo) => {
        this.guardando   = false;
        this.mostrarForm = false;
        this.proyectoActivo.seleccionar(nuevo);
        this.router.navigate(['/proyecto']);
      },
      error: () => {
        this.guardando = false;
        this.error     = 'Error al crear el proyecto';
        this.cdr.detectChanges();
      },
    });
  }

  formValido(): boolean {
    const f = this.form;
    return !!(f.nombre && f.codigo && f.descripcion_problema &&
              f.objetivo_general && f.fecha_inicio && f.analista_responsable);
  }

  limpiarForm(): void {
    this.form = {
      nombre: '', codigo: '', descripcion_problema: '',
      objetivo_general: '', fecha_inicio: '', analista_responsable: '',
    };
  }

  // ════════════════════════════════════════════
  // ELIMINAR
  // ════════════════════════════════════════════

  confirmarEliminar(p: ProyectoResumen, event: Event): void {
    event.stopPropagation();
    this.proyectoAEliminar = p;
  }

  cancelarEliminar(): void {
    this.proyectoAEliminar = null;
  }

  eliminar(): void {
    if (!this.proyectoAEliminar) return;
    const id = this.proyectoAEliminar.id_proyecto;

    this.http.delete(`http://localhost:8000/proyectos/${id}`).subscribe({
      next: () => {
        this.proyectos         = this.proyectos.filter(p => p.id_proyecto !== id);
        this.proyectoAEliminar = null;
        // Si era el activo, lo limpiamos
        if (this.proyectoActivo.proyectoId === id) {
          this.proyectoActivo.limpiar();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al eliminar el proyecto';
        this.proyectoAEliminar = null;
        this.cdr.detectChanges();
      },
    });
  }

  // ════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  /** Iniciales para el avatar de la card */
  iniciales(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  /** Color consistente basado en el nombre */
  colorCard(nombre: string): string {
    const colores = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];
    let hash = 0;
    for (const c of nombre) hash = (hash * 31 + c.charCodeAt(0)) % colores.length;
    return colores[Math.abs(hash)];
  }
}