import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proyecto, ProyectoCreate, ProyectoUpdate } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {

  // authInterceptorFn ya agrega el token automáticamente — no se necesita getHeaders()
  private readonly baseUrl = `${environment.apiUrl}/proyectos`;

  constructor(private http: HttpClient) {}

  crear(data: ProyectoCreate): Observable<Proyecto> {
    return this.http.post<Proyecto>(`${this.baseUrl}/`, data);
  }

  listar(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.baseUrl}/`);
  }

  obtener(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.baseUrl}/${id}`);
  }

  actualizar(id: number, data: ProyectoUpdate): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.baseUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<{ detail: string }> {
    return this.http.delete<{ detail: string }>(`${this.baseUrl}/${id}`);
  }
}