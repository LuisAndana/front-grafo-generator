// src/app/core/services/negociacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Negociacion {
  id?: number;
  proyecto_id: number;
  rf_id: number;
  rf_codigo: string;
  rf_descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  aceptado: boolean;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NegociacionResumen {
  total: number;
  aceptados: number;
  rechazados: number;
  alta: number;
  media: number;
  baja: number;
}

@Injectable({
  providedIn: 'root'
})
export class NegociacionService {
  private apiUrl = `${environment.apiUrl}/api/negociacion`;
  private negociacionesSubject = new BehaviorSubject<Negociacion[]>([]);
  public negociaciones$ = this.negociacionesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las negociaciones de un proyecto
   */
  obtenerPorProyecto(proyectoId: number): Observable<Negociacion[]> {
    return this.http.get<any>(`${this.apiUrl}/?proyecto_id=${proyectoId}`).pipe(
      map(response => {
        // Maneja la respuesta del backend que envía { success, data, count }
        const negociaciones = response.data || response || [];
        
        // Si no es un array, retorna un array vacío
        if (!Array.isArray(negociaciones)) {
          return [];
        }
        
        // Mapea los datos de la BD a la interfaz esperada
        return negociaciones.map((n: any) => ({
          id: n.id_negociacion,
          proyecto_id: n.proyecto_id,
          rf_id: n.rf_id || 0,
          rf_codigo: '',
          rf_descripcion: n.descripcion || '',
          prioridad: (n.prioridad || 'Media') as 'Alta' | 'Media' | 'Baja',
          aceptado: n.aceptado === 1 || n.aceptado === true,
          observaciones: n.observaciones || '',
          nombre: n.nombre || '',
          created_at: n.created_at,
          updated_at: n.updated_at
        }));
      })
    );
  }

  /**
   * Obtener resumen de negociaciones
   */
  obtenerResumen(proyectoId: number): Observable<NegociacionResumen> {
    return this.http.get<NegociacionResumen>(`${this.apiUrl}/resumen?proyecto_id=${proyectoId}`);
  }

  /**
   * Crear una nueva negociación
   */
  crear(data: Negociacion): Observable<Negociacion> {
    // Mapea los datos del formulario Angular a los campos esperados por el backend
    const payload = {
      proyecto_id: data.proyecto_id,
      nombre: data.rf_codigo || `RF-${data.proyecto_id}`,
      descripcion: data.rf_descripcion || '',
      prioridad: data.prioridad || 'Media',
      aceptado: data.aceptado ? 1 : 0
    };
    
    console.log('Enviando negociación:', payload);
    
    return this.http.post<any>(`${this.apiUrl}/`, payload).pipe(
      map(response => {
        // Mapea la respuesta del backend a la interfaz Negociacion
        const n = response.data || response;
        return {
          id: n.id_negociacion,
          proyecto_id: n.proyecto_id,
          rf_id: data.rf_id,
          rf_codigo: data.rf_codigo,
          rf_descripcion: n.descripcion || data.rf_descripcion,
          prioridad: (n.prioridad || 'Media') as 'Alta' | 'Media' | 'Baja',
          aceptado: n.aceptado === 1 || n.aceptado === true,
          observaciones: n.observaciones || '',
          nombre: n.nombre || '',
          created_at: n.created_at,
          updated_at: n.updated_at
        };
      })
    );
  }

  /**
   * Actualizar una negociación
   */
  actualizar(id: number, data: Partial<Negociacion>): Observable<Negociacion> {
    return this.http.put<Negociacion>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Eliminar una negociación
   */
  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar estado de aceptación
   */
  actualizarAceptado(id: number, aceptado: boolean): Observable<Negociacion> {
    return this.http.patch<Negociacion>(`${this.apiUrl}/${id}`, { aceptado });
  }

  /**
   * Actualizar prioridad
   */
  actualizarPrioridad(id: number, prioridad: 'Alta' | 'Media' | 'Baja'): Observable<Negociacion> {
    return this.http.patch<Negociacion>(`${this.apiUrl}/${id}`, { prioridad });
  }

  /**
   * Actualizar observaciones
   */
  actualizarObservaciones(id: number, observaciones: string): Observable<Negociacion> {
    return this.http.patch<Negociacion>(`${this.apiUrl}/${id}`, { observaciones });
  }

  /**
   * Actualizar cache local
   */
  setNegociaciones(negociaciones: Negociacion[]): void {
    this.negociacionesSubject.next(negociaciones);
  }

  /**
   * Obtener cache local
   */
  getNegociaciones(): Negociacion[] {
    return this.negociacionesSubject.value;
  }
}