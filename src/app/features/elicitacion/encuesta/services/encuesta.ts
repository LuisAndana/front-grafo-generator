import { Injectable } from '@angular/core';

export interface Pregunta {
  texto: string;
}

export interface Encuesta {
  id: string;
  titulo: string;
  objetivo: string;
  perfil: string;
  preguntas: Pregunta[];
  fecha: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EncuestaService {

  private storageKey = 'grafo_encuestas';

  getEncuestas(): Encuesta[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  guardarEncuesta(encuesta: Encuesta) {
    const encuestas = this.getEncuestas();
    encuestas.push(encuesta);
    localStorage.setItem(this.storageKey, JSON.stringify(encuestas));
  }
}
