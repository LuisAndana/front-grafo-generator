import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

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
    MatChipsModule
  ],
  templateUrl: './rf.html',
  styleUrls: ['./rf.css']
})
export class Rf implements OnInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  descripcion = '';
  actor = '';
  prioridad = 'Media';
  estado = 'Borrador';

  requerimientos: any[] = [];

  columnas = ['codigo', 'descripcion', 'actor', 'prioridad', 'estado', 'acciones'];

  // =============================
  // INIT
  // =============================

  ngOnInit(): void {
    this.cargarDatos();
  }

  // =============================
  // GENERAR CÓDIGO AUTOMÁTICO
  // =============================

  generarCodigo(): string {
    const ultimoNumero = this.requerimientos.length + 1;
    return `RF${ultimoNumero.toString().padStart(2, '0')}`;
  }

  // =============================
  // AGREGAR RF
  // =============================

  agregar() {
    if (!this.descripcion || !this.actor) {
      alert('Completa todos los campos');
      return;
    }

    const nuevo = {
      codigo: this.generarCodigo(),
      descripcion: this.descripcion,
      actor: this.actor,
      prioridad: this.prioridad,
      estado: this.estado
    };

    // IMPORTANTE para que Angular Material refresque la tabla
    this.requerimientos = [...this.requerimientos, nuevo];

    this.guardarDatos();
    this.limpiar();
  }

  // =============================
  // ELIMINAR
  // =============================

  eliminar(index: number) {
    this.requerimientos.splice(index, 1);
    this.requerimientos = [...this.requerimientos];
    this.guardarDatos();
  }

  limpiar() {
    this.descripcion = '';
    this.actor = '';
    this.prioridad = 'Media';
    this.estado = 'Borrador';
  }

  // =============================
  // LOCAL STORAGE (SSR SAFE)
  // =============================

  guardarDatos() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(
        'rfData',
        JSON.stringify(this.requerimientos)
      );
    }
  }

  cargarDatos() {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('rfData');
      if (!data) return;

      this.requerimientos = JSON.parse(data);
      this.requerimientos = [...this.requerimientos]; // refresca tabla
    }
  }

  // =============================
  // CONTADORES DINÁMICOS
  // =============================

  get total() {
    return this.requerimientos.length;
  }

  get completados() {
    return this.requerimientos.filter(r => r.estado === 'Completado').length;
  }

  get enProgreso() {
    return this.requerimientos.filter(r => r.estado === 'En progreso').length;
  }

  get borradores() {
    return this.requerimientos.filter(r => r.estado === 'Borrador').length;
  }
}
