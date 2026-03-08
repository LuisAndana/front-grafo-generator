// src/app/features/elicitacion/pages/elicitacion-dashboard/elicitacion-dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ElicitacionService, Entrevista, Proceso, Necesidad } from '../../services/elicitacion.service';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

@Component({
  selector: 'app-elicitacion-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elicitacion-dashboard.html',
  styleUrls: ['./elicitacion-dashboard.css']
})
export class ElicitacionDashboard implements OnInit {

  constructor(
    private elicitacionService: ElicitacionService,
    private proyectoActivoSvc: ProyectoActivoService,
    private router: Router
  ) {}

  // ─── Proyecto activo ────────────────────────────
  proyectoId: number | null = null;
  proyectoNombre = '';

  // ─── Modelos de formulario ──────────────────────
  entrevista = { pregunta: '', respuesta: '', observaciones: '' };
  proceso    = { nombre: '', descripcion: '', problemas: '' };
  necesidadesBase = { usuarios: false, reportes: false, inventarios: false, ventas: false };
  nuevaNecesidad  = '';

  // ─── Listas desde BD ───────────────────────────
  entrevistas:      Entrevista[] = [];
  procesos:         Proceso[]    = [];
  listaNecesidades: Necesidad[]  = [];

  // ─── Estado ─────────────────────────────────────
  showSuccess    = false;
  successMessage = '';
  isSaving       = false;

  // ════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════

  ngOnInit(): void {
    // ← Leer proyecto activo
    this.proyectoId     = this.proyectoActivoSvc.proyectoId;
    this.proyectoNombre = this.proyectoActivoSvc.proyecto?.nombre ?? '';
    this.cargarDatos();
  }

  cargarDatos(): void {
    const pid = this.proyectoId ?? undefined;

    this.elicitacionService.getEntrevistas(pid).subscribe({
      next: (data) => this.entrevistas = data,
      error: (err) => console.error('Error cargando entrevistas:', err)
    });

    this.elicitacionService.getProcesos(pid).subscribe({
      next: (data) => this.procesos = data,
      error: (err) => console.error('Error cargando procesos:', err)
    });

    this.elicitacionService.getNecesidades(pid).subscribe({
      next: (data) => this.listaNecesidades = data,
      error: (err) => console.error('Error cargando necesidades:', err)
    });
  }

  // ════════════════════════════════════════════════
  // ENTREVISTAS
  // ════════════════════════════════════════════════

  agregarEntrevista(): void {
    if (!this.entrevista.pregunta.trim() || !this.entrevista.respuesta.trim()) return;

    this.elicitacionService.crearEntrevista({
      proyecto_id:   this.proyectoId,   // ← con proyecto activo
      pregunta:      this.entrevista.pregunta,
      respuesta:     this.entrevista.respuesta,
      observaciones: this.entrevista.observaciones
    }).subscribe({
      next: (nueva) => {
        this.entrevistas.unshift(nueva);
        this.entrevista = { pregunta: '', respuesta: '', observaciones: '' };
        this.mostrarExito('Entrevista agregada');
      },
      error: (err) => console.error('Error creando entrevista:', err)
    });
  }

  eliminarEntrevista(id: number): void {
    this.elicitacionService.deleteEntrevista(id).subscribe({
      next: () => {
        this.entrevistas = this.entrevistas.filter(e => e.id_entrevista !== id);
      }
    });
  }

  // ════════════════════════════════════════════════
  // PROCESOS
  // ════════════════════════════════════════════════

  agregarProceso(): void {
    if (!this.proceso.nombre.trim()) return;

    this.elicitacionService.crearProceso({
      proyecto_id:          this.proyectoId,   // ← con proyecto activo
      nombre_proceso:       this.proceso.nombre,
      descripcion:          this.proceso.descripcion,
      problemas_detectados: this.proceso.problemas
    }).subscribe({
      next: (nuevo) => {
        this.procesos.unshift(nuevo);
        this.proceso = { nombre: '', descripcion: '', problemas: '' };
        this.mostrarExito('Proceso agregado');
      },
      error: (err) => console.error('Error creando proceso:', err)
    });
  }

  eliminarProceso(id: number): void {
    this.elicitacionService.deleteProceso(id).subscribe({
      next: () => {
        this.procesos = this.procesos.filter(p => p.id_proceso !== id);
      }
    });
  }

  // ════════════════════════════════════════════════
  // NECESIDADES
  // ════════════════════════════════════════════════

  agregarNecesidad(): void {
    if (!this.nuevaNecesidad.trim()) return;

    this.elicitacionService.crearNecesidad({
      proyecto_id:    this.proyectoId,   // ← con proyecto activo
      nombre:         this.nuevaNecesidad,
      es_predefinida: 0,
      seleccionada:   1
    }).subscribe({
      next: (nueva) => {
        this.listaNecesidades.unshift(nueva);
        this.nuevaNecesidad = '';
        this.mostrarExito('Necesidad agregada');
      },
      error: (err) => console.error('Error creando necesidad:', err)
    });
  }

  guardarNecesidadBase(nombre: string, seleccionada: boolean): void {
    if (!seleccionada) return;

    this.elicitacionService.crearNecesidad({
      proyecto_id:    this.proyectoId,   // ← con proyecto activo
      nombre:         nombre,
      es_predefinida: 1,
      seleccionada:   1
    }).subscribe({
      next: (nueva) => this.listaNecesidades.unshift(nueva)
    });
  }

  eliminarNecesidad(id: number): void {
    this.elicitacionService.deleteNecesidad(id).subscribe({
      next: () => {
        this.listaNecesidades = this.listaNecesidades.filter(n => n.id_necesidad !== id);
      }
    });
  }

  // ════════════════════════════════════════════════
  // CONTINUAR
  // ════════════════════════════════════════════════

  guardarYContinuar(): void {
    this.isSaving = true;
    this.mostrarExito('Datos guardados. Redirigiendo a Requerimientos...');
    setTimeout(() => {
      this.isSaving = false;
      this.router.navigate(['/requerimientos']);
    }, 1500);
  }

  // ════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════

  get totalNecesidades(): number {
    return this.listaNecesidades.length;
  }

  mostrarExito(mensaje: string): void {
    this.successMessage = mensaje;
    this.showSuccess    = true;
    setTimeout(() => this.showSuccess = false, 3000);
  }
}