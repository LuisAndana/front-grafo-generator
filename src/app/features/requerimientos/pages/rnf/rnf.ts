import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ],
  templateUrl: './rnf.html',
  styleUrls: ['./rnf.css']
})
export class Rnf implements OnInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  tipo = '';
  descripcion = '';
  metrica = '';

  rnfList: any[] = [];

  columnas = ['codigo', 'tipo', 'descripcion', 'metrica', 'acciones'];

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
    const numero = this.rnfList.length + 1;
    return `RNF${numero.toString().padStart(2, '0')}`;
  }

  // =============================
  // AGREGAR
  // =============================

  agregar() {
    if (!this.tipo || !this.descripcion || !this.metrica) {
      alert('Completa todos los campos');
      return;
    }

    const nuevo = {
      codigo: this.generarCodigo(),
      tipo: this.tipo,
      descripcion: this.descripcion,
      metrica: this.metrica
    };

    // Spread operator para refrescar tabla
    this.rnfList = [...this.rnfList, nuevo];

    this.guardarDatos();
    this.limpiar();
  }

  // =============================
  // ELIMINAR
  // =============================

  eliminar(index: number) {
    this.rnfList.splice(index, 1);
    this.rnfList = [...this.rnfList];
    this.guardarDatos();
  }

  limpiar() {
    this.tipo = '';
    this.descripcion = '';
    this.metrica = '';
  }

  // =============================
  // LOCAL STORAGE (SSR SAFE)
  // =============================

  guardarDatos() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(
        'rnfData',
        JSON.stringify(this.rnfList)
      );
    }
  }

  cargarDatos() {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('rnfData');
      if (!data) return;

      this.rnfList = JSON.parse(data);
      this.rnfList = [...this.rnfList]; // refresca tabla
    }
  }

  // =============================
  // CONTADOR TOTAL
  // =============================

  get total() {
    return this.rnfList.length;
  }
}
