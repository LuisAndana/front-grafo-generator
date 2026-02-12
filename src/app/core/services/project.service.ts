import { Injectable } from '@angular/core';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private proyectoActual: Project | null = null;

  guardarProyecto(proyecto: Project) {
    this.proyectoActual = proyecto;
    console.log('Proyecto guardado:', proyecto);
  }

  obtenerProyecto(): Project | null {
    return this.proyectoActual;
  }
}
