import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  email: string;
  nombre: string;
  apellido: string;
  fechaLogin?: Date;
  fechaRegistro?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioSubject: BehaviorSubject<Usuario | null>;
  public usuario$: Observable<Usuario | null>;

  constructor(private router: Router) {
    const usuarioGuardado = this.getUsuarioFromStorage();
    this.usuarioSubject = new BehaviorSubject<Usuario | null>(usuarioGuardado);
    this.usuario$ = this.usuarioSubject.asObservable();
  }

  /**
   * Obtener el usuario actual
   */
  public get usuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    return localStorage.getItem('srs_authenticated') === 'true';
  }

  /**
   * Login (sin backend por ahora)
   */
  login(email: string, password: string): boolean {
    // Aquí irá la lógica de autenticación con backend
    // Por ahora, cualquier email/password es válido
    
    const usuario: Usuario = {
      email: email,
      nombre: 'Usuario',
      apellido: 'Demo',
      fechaLogin: new Date()
    };

    this.setUsuarioStorage(usuario);
    this.usuarioSubject.next(usuario);
    
    return true;
  }

  /**
   * Registro (sin backend por ahora)
   */
  register(nombre: string, apellido: string, email: string, password: string): boolean {
    // Aquí irá la lógica de registro con backend
    
    const usuario: Usuario = {
      email: email,
      nombre: nombre,
      apellido: apellido,
      fechaRegistro: new Date()
    };

    this.setUsuarioStorage(usuario);
    this.usuarioSubject.next(usuario);
    
    return true;
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('srs_usuario');
    localStorage.removeItem('srs_authenticated');
    this.usuarioSubject.next(null);
    this.router.navigate(['/bienvenida']);
  }

  /**
   * Guardar usuario en localStorage
   */
  private setUsuarioStorage(usuario: Usuario): void {
    localStorage.setItem('srs_usuario', JSON.stringify(usuario));
    localStorage.setItem('srs_authenticated', 'true');
  }

  /**
   * Obtener usuario de localStorage
   */
  private getUsuarioFromStorage(): Usuario | null {
    const usuarioStr = localStorage.getItem('srs_usuario');
    if (usuarioStr) {
      try {
        return JSON.parse(usuarioStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Actualizar perfil de usuario
   */
  actualizarPerfil(usuario: Partial<Usuario>): void {
    const usuarioActual = this.usuarioActual;
    if (usuarioActual) {
      const usuarioActualizado = { ...usuarioActual, ...usuario };
      this.setUsuarioStorage(usuarioActualizado);
      this.usuarioSubject.next(usuarioActualizado);
    }
  }
}