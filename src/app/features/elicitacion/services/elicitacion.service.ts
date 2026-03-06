import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Entrevista {
  id_entrevista?: number;
  proyecto_id?: number | null;
  pregunta: string;
  respuesta: string;
  observaciones: string;
  created_at?: string;
  updated_at?: string;
}

export interface Proceso {
  id_proceso?: number;
  proyecto_id?: number | null;
  nombre_proceso: string;
  descripcion: string;
  problemas_detectados: string;
  created_at?: string;
  updated_at?: string;
}

export interface Necesidad {
  id_necesidad?: number;
  proyecto_id?: number | null;
  nombre: string;
  es_predefinida: number;
  seleccionada: number;
  created_at?: string;
}

export interface ElicitacionResumen {
  total_entrevistas: number;
  total_procesos: number;
  total_necesidades: number;
}

@Injectable({
  providedIn: 'root'
})
export class ElicitacionService {
  private readonly baseUrl = `${environment.apiUrl}/elicitacion`;

  constructor(private http: HttpClient) {}

  // ═══════════ ENTREVISTAS ═══════════

  crearEntrevista(data: { proyecto_id?: number | null; pregunta: string; respuesta: string; observaciones: string }): Observable<Entrevista> {
    return this.http.post<Entrevista>(`${this.baseUrl}/entrevistas/`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getEntrevistas(proyectoId?: number): Observable<Entrevista[]> {
    let params = new HttpParams();
    if (proyectoId) params = params.set('proyecto_id', proyectoId.toString());
    return this.http.get<Entrevista[]>(`${this.baseUrl}/entrevistas/`, { params });
  }

  deleteEntrevista(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/entrevistas/${id}`);
  }

  // ═══════════ PROCESOS ═══════════

  crearProceso(data: { proyecto_id?: number | null; nombre_proceso: string; descripcion: string; problemas_detectados: string }): Observable<Proceso> {
    return this.http.post<Proceso>(`${this.baseUrl}/procesos/`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getProcesos(proyectoId?: number): Observable<Proceso[]> {
    let params = new HttpParams();
    if (proyectoId) params = params.set('proyecto_id', proyectoId.toString());
    return this.http.get<Proceso[]>(`${this.baseUrl}/procesos/`, { params });
  }

  deleteProceso(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/procesos/${id}`);
  }

  // ═══════════ NECESIDADES ═══════════

  crearNecesidad(data: { proyecto_id?: number | null; nombre: string; es_predefinida: number; seleccionada: number }): Observable<Necesidad> {
    return this.http.post<Necesidad>(`${this.baseUrl}/necesidades/`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getNecesidades(proyectoId?: number): Observable<Necesidad[]> {
    let params = new HttpParams();
    if (proyectoId) params = params.set('proyecto_id', proyectoId.toString());
    return this.http.get<Necesidad[]>(`${this.baseUrl}/necesidades/`, { params });
  }

  deleteNecesidad(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/necesidades/${id}`);
  }

  // ═══════════ RESUMEN ═══════════

  getResumen(proyectoId?: number): Observable<ElicitacionResumen> {
    let params = new HttpParams();
    if (proyectoId) params = params.set('proyecto_id', proyectoId.toString());
    return this.http.get<ElicitacionResumen>(`${this.baseUrl}/resumen`, { params });
  }
}