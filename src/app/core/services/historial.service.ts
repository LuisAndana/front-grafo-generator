import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface HistorialAccion {
  id: string;
  accion: string;
  modulo: string;
  detalle?: any;
  descripcion?:string;
  fecha: Date;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialService {

  private storageKey = 'grafo_historial';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  obtenerHistorial(): HistorialAccion[] {
    if (!this.isBrowser) return [];

    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  registrarAccion(accion: string, modulo: string, detalle?: any) {

    if (!this.isBrowser) return;

    const historial = this.obtenerHistorial();

    const nuevaAccion: HistorialAccion = {
      id: crypto.randomUUID(),
      accion,
      modulo,
      detalle,
      fecha: new Date()
    };

    historial.unshift(nuevaAccion);

    localStorage.setItem(this.storageKey, JSON.stringify(historial));
  }


  limpiarHistorial() {
    if (!this.isBrowser) return;

    localStorage.removeItem(this.storageKey);
  }

  private generarDescripcion(accion: string, modulo: string, detalles: any): string {

  if (modulo === 'Encuesta') {

    if (accion.includes('Guardó')) {
      return `Se guardó la encuesta "${detalles.titulo || 'Sin título'}" 
      con ${detalles.totalPreguntas || 0} preguntas 
      dirigida al perfil "${detalles.perfil || 'No especificado'}".`;
    }

    if (accion.includes('Agregó')) {
      return `Se agregó una nueva pregunta a la encuesta 
      "${detalles.tituloEncuesta || 'Sin título'}".
      Total actual: ${detalles.totalPreguntas}.`;
    }

    if (accion.includes('Eliminó')) {
      return `Se eliminó la pregunta "${detalles.preguntaEliminada || ''}"
      de la encuesta "${detalles.tituloEncuesta || 'Sin título'}".
      Total restante: ${detalles.totalRestante}.`;
    }
  }

  return accion; // fallback
}

}
