import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class Rnf {

  tipo = '';
  descripcion = '';
  metrica = '';

  contador = 1;
  rnfList: any[] = [];

  columnas = ['codigo', 'tipo', 'descripcion', 'metrica', 'acciones'];

  agregar() {
    const codigo = `RNF0${this.contador++}`;

    this.rnfList.push({
      codigo,
      tipo: this.tipo,
      descripcion: this.descripcion,
      metrica: this.metrica
    });

    this.tipo = '';
    this.descripcion = '';
    this.metrica = '';
  }

  eliminar(index: number) {
    this.rnfList.splice(index, 1);
  }
}
