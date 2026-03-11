// src/app/core/services/requerimiento-no-funcional.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RNF {
  id_rnf: number;
  proyecto_id: number;
  codigo: string;
  tipo: string;
  descripcion: string;
  metrica?: string;
  created_at: string;
  updated_at: string;
}

export interface RNFCreate {
  proyecto_id: number;
  tipo: string;
  descripcion: string;
  metrica?: string;
}

export interface RNFUpdate {
  tipo?: string;
  descripcion?: string;
  metrica?: string;
}

export interface RNFResumen {
  total: number;
  por_tipo: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class RequerimientoNoFuncionalService {
  private apiUrl = 'http://localhost:8000/rnf';

  constructor(private http: HttpClient) { }

  /**
   * Listar todos los RNF de un proyecto
   * GET /rnf/?proyecto_id=1
   */
  listar(proyectoId: number): Observable<RNF[]> {
    const params = new HttpParams().set('proyecto_id', proyectoId.toString());
    return this.http.get<RNF[]>(`${this.apiUrl}/`, { params });
  }

  /**
   * Obtener un RNF específico
   * GET /rnf/{rnf_id}
   */
  obtener(rnfId: number): Observable<RNF> {
    return this.http.get<RNF>(`${this.apiUrl}/${rnfId}`);
  }

  /**
   * Crear un nuevo RNF
   * POST /rnf/
   * Body: { proyecto_id, tipo, descripcion, metrica }
   */
  crear(data: RNFCreate): Observable<RNF> {
    return this.http.post<RNF>(`${this.apiUrl}/`, data);
  }

  /**
   * Actualizar un RNF
   * PUT /rnf/{rnf_id}
   * Body: { tipo, descripcion, metrica }
   */
  actualizar(rnfId: number, data: RNFUpdate): Observable<RNF> {
    return this.http.put<RNF>(`${this.apiUrl}/${rnfId}`, data);
  }

  /**
   * Eliminar un RNF
   * DELETE /rnf/{rnf_id}
   */
  eliminar(rnfId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${rnfId}`);
  }

  /**
   * Obtener resumen de RNF de un proyecto
   * GET /rnf/resumen?proyecto_id=1
   */
  obtenerResumen(proyectoId: number): Observable<RNFResumen> {
    const params = new HttpParams().set('proyecto_id', proyectoId.toString());
    return this.http.get<RNFResumen>(`${this.apiUrl}/resumen`, { params });
  }
}