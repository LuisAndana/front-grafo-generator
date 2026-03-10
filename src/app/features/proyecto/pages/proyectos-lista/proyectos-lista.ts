// src/app/features/proyecto/pages/proyectos-lista/proyectos-lista.ts
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
    // Validar que todos los campos cumplan con requisitos mínimos
    return !!(
      f.nombre && f.nombre.length >= 3 &&
      f.codigo && f.codigo.length >= 2 &&
      f.descripcion_problema && f.descripcion_problema.length >= 10 &&
      f.objetivo_general && f.objetivo_general.length >= 10 &&
      f.fecha_inicio &&
      f.analista_responsable && f.analista_responsable.length >= 3
    );
  }

  limpiarForm(): void {
    this.form = {
      nombre: '', codigo: '', descripcion_problema: '',
      objetivo_general: '', fecha_inicio: '', analista_responsable: '',
    };
  }

  // ════════════════════════════════════════════
  // VALIDACIÓN DE CAMPOS ESPECÍFICOS
  // ════════════════════════════════════════════

  /**
   * Verifica si un campo es inválido
   */
  isFieldInvalid(fieldName: string): boolean {
    const value = this.form[fieldName as keyof typeof this.form];
    
    switch (fieldName) {
      case 'nombre':
        return value.length > 0 && value.length < 3;
      case 'codigo':
        return value.length > 0 && value.length < 2;
      case 'descripcion_problema':
        return value.length > 0 && value.length < 10;
      case 'objetivo_general':
        return value.length > 0 && value.length < 10;
      case 'analista_responsable':
        return value.length > 0 && value.length < 3;
      case 'fecha_inicio':
        return !value;
      default:
        return false;
    }
  }

  /**
   * Retorna el mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const value = this.form[fieldName as keyof typeof this.form];
    
    if (!value) return '';

    switch (fieldName) {
      case 'nombre':
        return `Mínimo 3 caracteres (tienes ${value.length})`;
      case 'codigo':
        return `Mínimo 2 caracteres (tienes ${value.length})`;
      case 'descripcion_problema':
        return `Mínimo 10 caracteres (tienes ${value.length})`;
      case 'objetivo_general':
        return `Mínimo 10 caracteres (tienes ${value.length})`;
      case 'analista_responsable':
        return `Mínimo 3 caracteres (tienes ${value.length})`;
      default:
        return '';
    }
  }

  /**
   * Calcula el porcentaje de avance para la barra de progreso
   */
  getFieldProgress(fieldName: string): number {
    const value = this.form[fieldName as keyof typeof this.form];
    if (!value) return 0;

    let minLength = 0;
    switch (fieldName) {
      case 'descripcion_problema':
      case 'objetivo_general':
        minLength = 10;
        break;
      case 'nombre':
        minLength = 3;
        break;
      case 'codigo':
        minLength = 2;
        break;
      case 'analista_responsable':
        minLength = 3;
        break;
    }

    return Math.min((value.length / minLength) * 100, 100);
  }

  /**
   * Retorna la clase CSS para el campo según su estado
   */
  getFieldClass(fieldName: string): string {
    if (this.isFieldInvalid(fieldName)) {
      return 'form-input-error';
    }
    const value = this.form[fieldName as keyof typeof this.form];
    if (value && !this.isFieldInvalid(fieldName)) {
      return 'form-input-valid';
    }
    return '';
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