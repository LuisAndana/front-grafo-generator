import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000';  // URL FastAPI

  constructor(private http: HttpClient) { }

  obtenerDatos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/datos`);
  }
}