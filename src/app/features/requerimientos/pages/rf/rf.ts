import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class Rf {

  descripcion = '';
  actor = '';
  prioridad = 'Media';
  estado = 'Borrador';

  contador = 1;

  requerimientos: any[] = [];

  columnas = ['codigo', 'descripcion', 'actor', 'prioridad', 'estado', 'acciones'];

  agregar() {
    const codigo = `RF0${this.contador++}`;

    this.requerimientos.push({
      codigo,
      descripcion: this.descripcion,
      actor: this.actor,
      prioridad: this.prioridad,
      estado: this.estado
    });

    this.descripcion = '';
    this.actor = '';
  }

  eliminar(index: number) {
    this.requerimientos.splice(index, 1);
  }
}
