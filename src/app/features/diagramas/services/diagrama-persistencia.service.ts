/**
 * Servicio para persistencia de diagramas en el backend
 * Maneja la comunicación con los endpoints REST para guardar y cargar diagramas
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MetadatosDiagrama {
  elementos: number;
  relaciones: number;
  tipos_elementos: string[];
  tipos_relaciones: string[];
  extra?: Record<string, any>;
}

export interface DiagramaGuardadoCreate {
  tipo: string;
  nombre?: string;
  metadatos: MetadatosDiagrama;
  codigo_mermaid?: string;
}

export interface DiagramaGuardadoResponse {
  id: number;
  proyecto_id: number;
  tipo: string;
  nombre?: string;
  metadatos: Record<string, any>;
  creado_en: string;
  actualizado_en: string;
}

export interface ContextoDiagramasResponse {
  total_diagramas: number;
  tipos_guardados: string[];
  elementos_totales: number;
  relaciones_totales: number;
  diagramas: DiagramaGuardadoResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class DiagramaPersistenciaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/diagramas`;

  /**
   * Guarda o actualiza un diagrama en el backend
   * @param proyectoId ID del proyecto
   * @param diagrama Datos del diagrama a guardar
   * @returns Observable con la respuesta del servidor
   */
  guardarDiagrama(
    proyectoId: number,
    diagrama: DiagramaGuardadoCreate
  ): Observable<DiagramaGuardadoResponse> {
    return this.http.post<DiagramaGuardadoResponse>(
      `${this.apiUrl}/${proyectoId}`,
      diagrama
    ).pipe(
      catchError(error => {
        console.error('Error al guardar diagrama:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el contexto agregado de todos los diagramas de un proyecto
   * Útil para proporcionar contexto a la IA
   * @param proyectoId ID del proyecto
   * @returns Observable con el resumen de diagramas
   */
  obtenerContextoDiagramas(proyectoId: number): Observable<ContextoDiagramasResponse> {
    return this.http.get<ContextoDiagramasResponse>(
      `${this.apiUrl}/contexto/${proyectoId}`
    ).pipe(
      catchError(error => {
        console.error('Error al obtener contexto de diagramas:', error);
        // Retorna un contexto vacío en caso de error
        return of({
          total_diagramas: 0,
          tipos_guardados: [],
          elementos_totales: 0,
          relaciones_totales: 0,
          diagramas: []
        });
      })
    );
  }

  /**
   * Lista todos los diagramas de un proyecto
   * @param proyectoId ID del proyecto
   * @param tipo Tipo de diagrama a filtrar (opcional)
   * @returns Observable con la lista de diagramas
   */
  listarDiagramas(
    proyectoId: number,
    tipo?: string
  ): Observable<DiagramaGuardadoResponse[]> {
    let url = `${this.apiUrl}/${proyectoId}`;
    if (tipo) {
      url += `?tipo=${encodeURIComponent(tipo)}`;
    }

    return this.http.get<DiagramaGuardadoResponse[]>(url).pipe(
      catchError(error => {
        console.error('Error al listar diagramas:', error);
        return of([]);
      })
    );
  }

  /**
   * Elimina un diagrama específico
   * @param proyectoId ID del proyecto
   * @param tipo Tipo de diagrama a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarDiagrama(
    proyectoId: number,
    tipo: string
  ): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/${proyectoId}/${tipo}`
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar diagrama:', error);
        throw error;
      })
    );
  }
}
