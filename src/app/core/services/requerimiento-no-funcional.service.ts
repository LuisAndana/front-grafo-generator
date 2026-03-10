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

  private apiUrl = 'http://localhost:8000/api/rnf';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene resumen de RNF de un proyecto
   */
  getResumen(proyecto_id: number): Observable<RNFResumen> {
    return this.http.get<RNFResumen>(`${this.apiUrl}/resumen`, {
      params: new HttpParams().set('proyecto_id', proyecto_id)
    });
  }

  /**
   * Crea un nuevo RNF
   */
  crear(data: RNFCreate): Observable<RNF> {
    return this.http.post<RNF>(`${this.apiUrl}/`, data);
  }

  /**
   * Lista todos los RNF de un proyecto
   */
  listar(proyecto_id: number): Observable<RNF[]> {
    return this.http.get<RNF[]>(`${this.apiUrl}/`, {
      params: new HttpParams().set('proyecto_id', proyecto_id)
    });
  }

  /**
   * Obtiene un RNF específico
   */
  obtener(rnf_id: number): Observable<RNF> {
    return this.http.get<RNF>(`${this.apiUrl}/${rnf_id}`);
  }

  /**
   * Actualiza un RNF
   */
  actualizar(rnf_id: number, data: RNFUpdate): Observable<RNF> {
    return this.http.put<RNF>(`${this.apiUrl}/${rnf_id}`, data);
  }

  /**
   * Elimina un RNF
   */
  eliminar(rnf_id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${rnf_id}`);
  }
}