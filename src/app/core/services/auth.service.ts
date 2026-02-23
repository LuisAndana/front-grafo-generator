import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';  // ✅ CORREGIDO: Sin .prod

export interface Usuario {
  email: string;
  nombre: string;
  apellido: string;
  rol?: string;
  fechaLogin?: Date;
  fechaRegistro?: Date;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
  message?: string;
}

export interface RegisterResponse {
  token: string;
  usuario: Usuario;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioSubject: BehaviorSubject<Usuario | null>;
  public usuario$: Observable<Usuario | null>;
  private apiUrl = environment.apiUrl || 'http://localhost:8000';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    const usuarioGuardado = this.getUsuarioFromStorage();
    this.usuarioSubject = new BehaviorSubject<Usuario | null>(usuarioGuardado);
    this.usuario$ = this.usuarioSubject.asObservable();
    console.log('🔐 AuthService inicializado. Usuario cargado:', usuarioGuardado);
  }

  /**
   * Obtener el usuario actual
   */
  public get usuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  /**
   * Obtener el token actual
   */
  public get token(): string | null {
    return localStorage.getItem('srs_token');
  }

  /**
   * Verificar si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    return localStorage.getItem('srs_authenticated') === 'true' && this.token !== null;
  }

  /**
   * Login con backend
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/usuarios/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        console.log('✅ Login exitoso:', response);
        // Guardar token y usuario
        this.setAuthData(response.token, response.usuario);
        this.usuarioSubject.next(response.usuario);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Registro con backend
   */
  register(nombre: string, apellido: string, email: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/usuarios/registro`, {
      nombre,
      apellido,
      email,
      password
    }).pipe(
      tap(response => {
        console.log('✅ Registro exitoso:', response);
        // Guardar token y usuario
        this.setAuthData(response.token, response.usuario);
        this.usuarioSubject.next(response.usuario);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout
   */
  logout(): void {
    console.log('🚪 Logout ejecutado');
    this.clearAuthData();
    this.usuarioSubject.next(null);
    console.log('📍 Navegando a /bienvenida');
    this.router.navigate(['/bienvenida']).then(success => {
      console.log('✅ Navegación a /bienvenida:', success ? 'exitosa' : 'fallida');
    });
  }

  /**
   * Verificar token con el backend
   */
  verifyToken(): Observable<boolean> {
    const token = this.token;
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/usuarios/verify-token`, { token }).pipe(
      map(response => response.valid),
      catchError(() => {
        this.logout();
        return throwError(() => new Error('Invalid token'));
      })
    );
  }

  /**
   * Actualizar perfil de usuario
   */
  actualizarPerfil(datosActualizados: Partial<Usuario>): Observable<Usuario> {
    const usuarioActual = this.usuarioActual;
    if (!usuarioActual) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }

    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/perfil`, datosActualizados).pipe(
      tap(usuarioActualizado => {
        console.log('✅ Perfil actualizado:', usuarioActualizado);
        this.setUsuarioStorage(usuarioActualizado);
        this.usuarioSubject.next(usuarioActualizado);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar rol del usuario
   */
  actualizarRol(rol: string): void {
    const usuarioActual = this.usuarioActual;
    if (usuarioActual) {
      const usuarioActualizado = { ...usuarioActual, rol };
      this.setUsuarioStorage(usuarioActualizado);
      this.usuarioSubject.next(usuarioActualizado);
    }
  }

  /**
   * Guardar datos de autenticación
   */
  private setAuthData(token: string, usuario: Usuario): void {
    console.log('💾 Guardando datos de autenticación');
    localStorage.setItem('srs_token', token);
    this.setUsuarioStorage(usuario);
    localStorage.setItem('srs_authenticated', 'true');
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    console.log('🗑️ Limpiando datos de autenticación');
    localStorage.removeItem('srs_token');
    localStorage.removeItem('srs_usuario');
    localStorage.removeItem('srs_authenticated');
  }

  /**
   * Guardar usuario en localStorage
   */
  private setUsuarioStorage(usuario: Usuario): void {
    const usuarioStr = JSON.stringify(usuario);
    console.log('📝 Guardando usuario en localStorage:', usuarioStr);
    localStorage.setItem('srs_usuario', usuarioStr);
  }

  /**
   * Obtener usuario de localStorage
   */
  private getUsuarioFromStorage(): Usuario | null {
    const usuarioStr = localStorage.getItem('srs_usuario');
    console.log('📖 Leyendo usuario de localStorage:', usuarioStr);
    
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        console.log('✅ Usuario parseado:', usuario);
        
        // Migración: agregar rol si no existe
        if (!usuario.rol) {
          usuario.rol = 'developer';
          this.setUsuarioStorage(usuario);
        }
        
        return usuario;
      } catch (error) {
        console.error('❌ Error al parsear usuario:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en el servidor';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      if (error.status === 401) {
        errorMessage = 'Credenciales inválidas';
      } else if (error.status === 409) {
        errorMessage = 'El usuario ya existe';
      } else if (error.status === 400) {
        errorMessage = error.error?.detail || 'Datos inválidos';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      }
    }

    console.error('❌ Error:', errorMessage);
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}