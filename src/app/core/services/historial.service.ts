import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface HistorialAccion {
  id_historial?: number;
  id?: string;               // compatibilidad con código anterior
  proyecto_id?: number;
  accion: string;
  modulo: string;
  detalles?: any;
  es_snapshot?: boolean;
  fecha: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialService {

  private readonly BASE_URL = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  // ── Obtener historial del proyecto ────────────────────────────────────────

  obtenerHistorial(proyectoId: number): Observable<HistorialAccion[]> {
    return this.http.get<any>(`${this.BASE_URL}/api/historial/?proyecto_id=${proyectoId}`).pipe(
      map(res => Array.isArray(res) ? res : res?.data ?? []),
      catchError(() => of([]))
    );
  }

  // ── Registrar una acción ──────────────────────────────────────────────────

  registrarAccion(
    proyectoId: number,
    accion: string,
    modulo: string,
    detalles?: any
  ): Observable<HistorialAccion> {
    const payload = { proyecto_id: proyectoId, accion, modulo, detalles: detalles ?? null, es_snapshot: false };
    return this.http.post<any>(`${this.BASE_URL}/api/historial/`, payload).pipe(
      map(res => res?.data ?? res),
      catchError(() => of({ accion, modulo, fecha: new Date() }))
    );
  }

  // ── Crear snapshot/respaldo completo ──────────────────────────────────────

  crearSnapshot(proyectoId: number): Observable<HistorialAccion> {
    return this.http.post<any>(`${this.BASE_URL}/api/historial/snapshot/${proyectoId}`, {}).pipe(
      map(res => res?.data ?? res)
    );
  }

  // ── Limpiar historial del proyecto ────────────────────────────────────────

  limpiarHistorial(proyectoId: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/api/historial/?proyecto_id=${proyectoId}`);
  }
}
