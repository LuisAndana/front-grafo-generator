import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EncuestaService, Encuesta } from '../../services/encuesta';
import { v4 as uuidv4 } from 'uuid';

import { HistorialService } from '../../../../../core/services/historial.service';

@Component({
  standalone: true,
  selector: 'app-encuesta',
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css'],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class EncuestaComponent {

  encuesta: Encuesta = this.crearEncuestaVacia();

  constructor(
    private encuestaService: EncuestaService,
    private historialService: HistorialService
  ) {}

  agregarPregunta() {
    this.encuesta.preguntas.push({ texto: '' });

    this.historialService.registrarAccion(
      'Agregó una nueva pregunta a la encuesta',
      'Encuesta',
      {
        tituloEncuesta: this.encuesta.titulo || 'Sin título',
        numeroPregunta: this.encuesta.preguntas.length,
        totalPreguntas: this.encuesta.preguntas.length,
        fecha: new Date()
      }
    );
  }

  eliminarPregunta(index: number) {

    const preguntaEliminada = this.encuesta.preguntas[index]?.texto || 'Pregunta sin texto';

    this.encuesta.preguntas.splice(index, 1);

    this.historialService.registrarAccion(
      'Eliminó una pregunta de la encuesta',
      'Encuesta',
      {
        tituloEncuesta: this.encuesta.titulo || 'Sin título',
        preguntaEliminada: preguntaEliminada,
        totalRestante: this.encuesta.preguntas.length,
        fecha: new Date()
      }
    );
  }

  guardar() {
    this.encuesta.id = uuidv4();
    this.encuesta.fecha = new Date();

    // Guardar encuesta si lo necesitas
    this.encuestaService.guardarEncuesta(this.encuesta);

    this.historialService.registrarAccion(
      'Guardó una encuesta completa',
      'Encuesta',
      {
        idEncuesta: this.encuesta.id,
        titulo: this.encuesta.titulo || 'Sin título',
        objetivo: this.encuesta.objetivo,
        perfil: this.encuesta.perfil,
        totalPreguntas: this.encuesta.preguntas.length,
        preguntas: this.encuesta.preguntas.map((p, i) => ({
          numero: i + 1,
          texto: p.texto
        })),
        fecha: new Date()
      }
    );

    this.resetFormulario();
  }

  resetFormulario() {
    this.encuesta = this.crearEncuestaVacia();
  }

  private crearEncuestaVacia(): Encuesta {
    return {
      id: '',
      titulo: '',
      objetivo: '',
      perfil: '',
      preguntas: [],
      fecha: new Date()
    };
  }
}
