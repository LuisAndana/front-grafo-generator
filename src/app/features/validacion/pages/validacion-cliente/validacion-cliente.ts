import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ValidacionData {
  checklist: any;
  observaciones: string;
  aprobador: string;
  fecha: string;
  firmaDigital: string;
  aprobado: boolean;
}

@Component({
  selector: 'app-validacion-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './validacion-cliente.html',
  styleUrl: './validacion-cliente.css'
})
export class ValidacionCliente implements OnInit {

  storageKey = 'validacion_cliente_data';

  checklist = {
    rf: false,
    rnf: false,
    casosUso: false,
    restricciones: false,
    prioridades: false
  };

  observaciones = '';
  aprobador = '';
  fecha = '';
  firmaDigital = '';
  aprobado = false;

  ngOnInit(): void {
    this.cargarDatos();
  }

  validarFormulario(): boolean {
    return (
      this.checklist.rf &&
      this.checklist.rnf &&
      this.aprobador.trim() !== '' &&
      this.fecha !== ''
    );
  }

  aprobar() {
    if (this.validarFormulario()) {
      this.aprobado = true;
      this.guardarDatos();
    }
  }

  guardarDatos() {
    const data: ValidacionData = {
      checklist: this.checklist,
      observaciones: this.observaciones,
      aprobador: this.aprobador,
      fecha: this.fecha,
      firmaDigital: this.firmaDigital,
      aprobado: this.aprobado
    };

    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  cargarDatos() {
    const data = localStorage.getItem(this.storageKey);

    if (data) {
      const parsed: ValidacionData = JSON.parse(data);

      this.checklist = parsed.checklist;
      this.observaciones = parsed.observaciones;
      this.aprobador = parsed.aprobador;
      this.fecha = parsed.fecha;
      this.firmaDigital = parsed.firmaDigital;
      this.aprobado = parsed.aprobado;
    }
  }

  limpiarValidacion() {
    localStorage.removeItem(this.storageKey);
    location.reload();
  }
}
