// src/app/core/services/requerimiento-funcional.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Prioridad = 'Alta' | 'Media' | 'Baja';
export type EstadoRF = 'Borrador' | 'En progreso' | 'Completado';

export interface RF {
  id_req: number;
  proyecto_id: number;
  codigo: string;
  descripcion: string;
  actor?: string;
  prioridad: Prioridad;
  estado: EstadoRF;
  created_at: string;
  updated_at: string;
}

export interface RFCreate {
  proyecto_id: number;
  descripcion: string;
  actor?: string;
  prioridad: Prioridad;
  estado: EstadoRF;
}

export interface RFUpdate {
  descripcion?: string;
  actor?: string;
  prioridad?: Prioridad;
  estado?: EstadoRF;
}

export interface RFResumen {
  total: number;
  completados: number;
  en_progreso: number;
  borradores: number;
  por_prioridad: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class RequerimientoFuncionalService {

  private apiUrl = 'http://localhost:8000/api/requerimientos-funcionales';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene resumen de RF de un proyecto
   */
  getResumen(proyecto_id: number): Observable<RFResumen> {
    return this.http.get<RFResumen>(`${this.apiUrl}/resumen`, {
      params: new HttpParams().set('proyecto_id', proyecto_id)
    });
  }

  /**
   * Crea un nuevo RF
   */
  crear(data: RFCreate): Observable<RF> {
    return this.http.post<RF>(`${this.apiUrl}/`, data);
  }

  /**
   * Lista todos los RF de un proyecto
   */
  listar(proyecto_id: number): Observable<RF[]> {
    return this.http.get<RF[]>(`${this.apiUrl}/`, {
      params: new HttpParams().set('proyecto_id', proyecto_id)
    });
  }

  /**
   * Obtiene un RF específico
   */
  obtener(rf_id: number): Observable<RF> {
    return this.http.get<RF>(`${this.apiUrl}/${rf_id}`);
  }

  /**
   * Actualiza un RF
   */
  actualizar(rf_id: number, data: RFUpdate): Observable<RF> {
    return this.http.put<RF>(`${this.apiUrl}/${rf_id}`, data);
  }

  /**
   * Elimina un RF
   */
  eliminar(rf_id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${rf_id}`);
  }
}