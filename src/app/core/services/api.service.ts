import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000';  //  URL de FastAPI

  constructor(private http: HttpClient) { }

  obtenerDatos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/datos`);
  }

  // Métodos de autenticación
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/login`, {
      username: email,
      password: password
    });
  }

  register(nombre: string, apellido: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register`, {
      email: email,
      username: nombre,
      password: password
    });
  }

  // Obtener usuario actual
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/auth/me`);
  }
}