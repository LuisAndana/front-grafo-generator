import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Stakeholder {
  id_stake?: number;
  proyecto_id?: number | null;
  nombre: string;
  rol: string;
  tipo: 'Interno' | 'Externo' | 'Regulador' | 'Proveedor' | 'Otro' | '';
  area: string;
  nivel_influencia: 'Alto' | 'Medio' | 'Bajo' | '';
  interes_sistema: string;
  created_at?: string;
  updated_at?: string;
}

export interface StakeholderCreate {
  proyecto_id?: number | null;
  nombre: string;
  rol: string;
  tipo: string;
  area: string;
  nivel_influencia: string;
  interes_sistema: string;
}

@Injectable({
  providedIn: 'root'
})
export class StakeholderService {
  private readonly baseUrl = `${environment.apiUrl}/stakeholders`;

  private stakeholdersSubject = new BehaviorSubject<Stakeholder[]>([]);
  public stakeholders$: Observable<Stakeholder[]> = this.stakeholdersSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Crear stakeholder en el backend
   */
  createStakeholder(data: StakeholderCreate): Observable<Stakeholder> {
    return this.http.post<Stakeholder>(`${this.baseUrl}/`, data).pipe(
      tap(nuevo => {
        const lista = this.stakeholdersSubject.value;
        this.stakeholdersSubject.next([nuevo, ...lista]);
      }),
      catchError(err => {
        console.error('Error al crear stakeholder:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Listar stakeholders (opcionalmente filtrar por proyecto)
   */
  getStakeholders(proyectoId?: number): Observable<Stakeholder[]> {
    let params = new HttpParams();
    if (proyectoId) {
      params = params.set('proyecto_id', proyectoId.toString());
    }

    return this.http.get<Stakeholder[]>(`${this.baseUrl}/`, { params }).pipe(
      tap(lista => this.stakeholdersSubject.next(lista)),
      catchError(err => {
        console.error('Error al listar stakeholders:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtener un stakeholder por ID
   */
  getStakeholderById(id: number): Observable<Stakeholder> {
    return this.http.get<Stakeholder>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualizar stakeholder
   */
  updateStakeholder(id: number, data: Partial<StakeholderCreate>): Observable<Stakeholder> {
    return this.http.put<Stakeholder>(`${this.baseUrl}/${id}`, data).pipe(
      tap(actualizado => {
        const lista = this.stakeholdersSubject.value.map(s =>
          s.id_stake === id ? actualizado : s
        );
        this.stakeholdersSubject.next(lista);
      }),
      catchError(err => {
        console.error('Error al actualizar stakeholder:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Eliminar stakeholder
   */
  deleteStakeholder(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const lista = this.stakeholdersSubject.value.filter(s => s.id_stake !== id);
        this.stakeholdersSubject.next(lista);
      }),
      catchError(err => {
        console.error('Error al eliminar stakeholder:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtener lista actual en memoria
   */
  getAllStakeholders(): Stakeholder[] {
    return this.stakeholdersSubject.value;
  }
}