import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-elicitacion-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './elicitacion-dashboard.html',
  styleUrls: ['./elicitacion-dashboard.css']
})
export class ElicitacionDashboard implements OnInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // =============================
  // MODELOS
  // =============================

  entrevista = {
    pregunta: '',
    respuesta: '',
    observaciones: ''
  };

  proceso = {
    nombre: '',
    descripcion: '',
    problemas: ''
  };

  necesidadesBase = {
    usuarios: false,
    reportes: false,
    inventarios: false,
    ventas: false
  };

  nuevaNecesidad: string = '';

  entrevistas: any[] = [];
  procesos: any[] = [];
  listaNecesidades: string[] = [];

  // =============================
  // INIT
  // =============================

  ngOnInit(): void {
    this.cargarDatos();
  }

  // =============================
  // ENTREVISTAS
  // =============================

  agregarEntrevista() {
    if (this.entrevista.pregunta.trim() === '') return;

    this.entrevistas.push({ ...this.entrevista });
    this.entrevista = { pregunta: '', respuesta: '', observaciones: '' };

    this.guardarDatos();
  }

  // =============================
  // PROCESOS
  // =============================

  agregarProceso() {
    if (this.proceso.nombre.trim() === '') return;

    this.procesos.push({ ...this.proceso });
    this.proceso = { nombre: '', descripcion: '', problemas: '' };

    this.guardarDatos();
  }

  // =============================
  // NECESIDADES
  // =============================

  agregarNecesidad() {
    if (this.nuevaNecesidad.trim() === '') return;

    this.listaNecesidades.push(this.nuevaNecesidad);
    this.nuevaNecesidad = '';

    this.guardarDatos();
  }

  eliminarNecesidad(index: number) {
    this.listaNecesidades.splice(index, 1);
    this.guardarDatos();
  }

  // =============================
  // RESUMEN DINÁMICO
  // =============================

  get totalNecesidades(): number {
    const baseSeleccionadas =
      Object.values(this.necesidadesBase).filter(v => v).length;

    return baseSeleccionadas + this.listaNecesidades.length;
  }

  // =============================
  // LOCAL STORAGE (VERSIÓN SSR SAFE)
  // =============================

  guardarDatos() {
    if (isPlatformBrowser(this.platformId)) {
      const data = {
        entrevistas: this.entrevistas,
        procesos: this.procesos,
        listaNecesidades: this.listaNecesidades,
        necesidadesBase: this.necesidadesBase
      };

      localStorage.setItem('elicitacionData', JSON.stringify(data));
    }
  }

  cargarDatos() {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('elicitacionData');

      if (!data) return;

      const parsed = JSON.parse(data);

      this.entrevistas = parsed.entrevistas || [];
      this.procesos = parsed.procesos || [];
      this.listaNecesidades = parsed.listaNecesidades || [];
      this.necesidadesBase = parsed.necesidadesBase || this.necesidadesBase;
    }
  }

}
