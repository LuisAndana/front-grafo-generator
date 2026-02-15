import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  id?: string;
  nombre: string;
  rolSistema: string;
  descripcionFunciones: string;
  permisosEsperados: string;
  fechaRegistro?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  public usuarios$: Observable<Usuario[]> = this.usuariosSubject.asObservable();

  private readonly STORAGE_KEY = 'srs_usuarios';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadFromStorage();
  }

  /**
   * Guardar usuario
   */
  saveUsuario(usuario: Usuario): void {
    const usuarios = this.usuariosSubject.value;
    const newUsuario: Usuario = {
      ...usuario,
      id: this.generateId(),
      fechaRegistro: new Date()
    };
    
    const updated = [...usuarios, newUsuario];
    this.usuariosSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Actualizar usuario existente
   */
  updateUsuario(id: string, usuario: Usuario): void {
    const usuarios = this.usuariosSubject.value;
    const index = usuarios.findIndex(u => u.id === id);
    
    if (index !== -1) {
      usuarios[index] = { ...usuario, id };
      this.usuariosSubject.next([...usuarios]);
      this.saveToStorage(usuarios);
    }
  }

  /**
   * Eliminar usuario
   */
  deleteUsuario(id: string): void {
    const usuarios = this.usuariosSubject.value;
    const filtered = usuarios.filter(u => u.id !== id);
    this.usuariosSubject.next(filtered);
    this.saveToStorage(filtered);
  }

  /**
   * Obtener usuario por ID
   */
  getUsuarioById(id: string): Usuario | undefined {
    return this.usuariosSubject.value.find(u => u.id === id);
  }

  /**
   * Obtener todos los usuarios
   */
  getAllUsuarios(): Usuario[] {
    return this.usuariosSubject.value;
  }

  /**
   * Filtrar usuarios por rol
   */
  getUsuariosByRol(rol: string): Usuario[] {
    return this.usuariosSubject.value.filter(u => u.rolSistema === rol);
  }

  /**
   * Exportar usuarios a JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.usuariosSubject.value, null, 2);
  }

  /**
   * Limpiar todos los usuarios
   */
  clearAll(): void {
    this.usuariosSubject.next([]);
    if (this.isBrowser) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guardar en localStorage (solo en navegador)
   */
  private saveToStorage(usuarios: Usuario[]): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuarios));
    } catch (error) {
      console.error('Error al guardar usuarios:', error);
    }
  }

  /**
   * Cargar desde localStorage (solo en navegador)
   */
  private loadFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const usuarios = JSON.parse(stored);
        this.usuariosSubject.next(usuarios);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }
}