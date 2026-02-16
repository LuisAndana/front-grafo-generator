import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { FocusGroupSession, FocusGroupResponse } from '../models/focus-group.model';

@Injectable({
  providedIn: 'root'
})
export class FocusGroupService {
  private apiUrl = 'http://localhost:8000/api/focus-group';
  
  private focusGroupsSubject = new BehaviorSubject<FocusGroupSession[]>([]);
  focusGroups$ = this.focusGroupsSubject.asObservable();

  private selectedFocusGroupSubject = new BehaviorSubject<FocusGroupSession | null>(null);
  selectedFocusGroup$ = this.selectedFocusGroupSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarFocusGroups();
  }

  cargarFocusGroups(): void {
    this.obtenerTodos().subscribe(
      (focusGroups: FocusGroupSession[]) => this.focusGroupsSubject.next(focusGroups),
      (error: any) => console.error('Error cargando focus groups:', error)
    );
  }

  obtenerTodos(): Observable<FocusGroupSession[]> {
    return this.http.get<FocusGroupResponse>(`${this.apiUrl}/listar`)
      .pipe(
        map(response => Array.isArray(response.data) ? response.data : []),
        catchError((error: any) => {
          console.error('Error en obtenerTodos:', error);
          return [];
        })
      );
  }

  obtenerPorId(id: string): Observable<FocusGroupSession> {
    return this.http.get<FocusGroupResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data as FocusGroupSession),
        catchError((error: any) => {
          console.error('Error en obtenerPorId:', error);
          throw error;
        })
      );
  }

  crear(focusGroup: Omit<FocusGroupSession, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<FocusGroupSession> {
    return this.http.post<FocusGroupResponse>(`${this.apiUrl}/crear`, focusGroup)
      .pipe(
        tap((response: FocusGroupResponse) => {
          const nuevoFG = response.data as FocusGroupSession;
          const focusGroups = this.focusGroupsSubject.value;
          this.focusGroupsSubject.next([...focusGroups, nuevoFG]);
        }),
        map(response => response.data as FocusGroupSession),
        catchError((error: any) => {
          console.error('Error en crear:', error);
          throw error;
        })
      );
  }

  actualizar(id: string, focusGroup: Partial<FocusGroupSession>): Observable<FocusGroupSession> {
    return this.http.put<FocusGroupResponse>(`${this.apiUrl}/${id}`, focusGroup)
      .pipe(
        tap((response: FocusGroupResponse) => {
          const fgActualizado = response.data as FocusGroupSession;
          const focusGroups = this.focusGroupsSubject.value.map(fg => 
            fg.id === id ? fgActualizado : fg
          );
          this.focusGroupsSubject.next(focusGroups);
        }),
        map(response => response.data as FocusGroupSession),
        catchError((error: any) => {
          console.error('Error en actualizar:', error);
          throw error;
        })
      );
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const focusGroups = this.focusGroupsSubject.value.filter(fg => fg.id !== id);
          this.focusGroupsSubject.next(focusGroups);
        }),
        catchError((error: any) => {
          console.error('Error en eliminar:', error);
          throw error;
        })
      );
  }

  buscar(termino: string): Observable<FocusGroupSession[]> {
    const params = new HttpParams().set('termino', termino);
    return this.http.get<FocusGroupResponse>(`${this.apiUrl}/buscar`, { params })
      .pipe(
        map(response => Array.isArray(response.data) ? response.data : []),
        catchError((error: any) => {
          console.error('Error en buscar:', error);
          return [];
        })
      );
  }

  filtrarPorEstado(estado: 'borrador' | 'activo' | 'completado'): Observable<FocusGroupSession[]> {
    return this.http.get<FocusGroupResponse>(`${this.apiUrl}/por-estado/${estado}`)
      .pipe(
        map(response => Array.isArray(response.data) ? response.data : []),
        catchError((error: any) => {
          console.error('Error en filtrarPorEstado:', error);
          return [];
        })
      );
  }

  obtenerEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`)
      .pipe(
        catchError((error: any) => {
          console.error('Error en obtenerEstadisticas:', error);
          throw error;
        })
      );
  }

  seleccionar(focusGroup: FocusGroupSession | null): void {
    this.selectedFocusGroupSubject.next(focusGroup);
  }

  obtenerSeleccionado(): FocusGroupSession | null {
    return this.selectedFocusGroupSubject.value;
  }
}