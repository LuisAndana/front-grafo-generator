// src/app/features/requerimientos/services/requerimiento-funcional.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RequerimientoFuncional,
  RequerimientoFuncionalCreate,
  RequerimientoFuncionalUpdate,
} from '../../core/models/requerimiento-funcional.model';

@Injectable({ providedIn: 'root' })
export class RequerimientoFuncionalService {
  private readonly base = 'http://localhost:8000/requerimientos-funcionales';

  constructor(private http: HttpClient) {}

  /** Lista todos los RF del usuario, opcionalmente filtrados por proyecto */
  listar(proyectoId?: number | null): Observable<RequerimientoFuncional[]> {
    let params = new HttpParams();
    if (proyectoId) {
      params = params.set('proyecto_id', proyectoId.toString());
    }
    return this.http.get<RequerimientoFuncional[]>(`${this.base}/`, { params });
  }

  /** Obtiene un RF por su id */
  obtener(idReq: number): Observable<RequerimientoFuncional> {
    return this.http.get<RequerimientoFuncional>(`${this.base}/${idReq}`);
  }

  /** Crea un nuevo RF */
  crear(data: RequerimientoFuncionalCreate): Observable<RequerimientoFuncional> {
    return this.http.post<RequerimientoFuncional>(`${this.base}/`, data);
  }

  /** Actualiza un RF existente */
  actualizar(idReq: number, data: RequerimientoFuncionalUpdate): Observable<RequerimientoFuncional> {
    return this.http.put<RequerimientoFuncional>(`${this.base}/${idReq}`, data);
  }

  /** Elimina un RF */
  eliminar(idReq: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${idReq}`);
  }
}