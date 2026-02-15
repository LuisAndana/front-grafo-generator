import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Stakeholder {
  id?: string;
  nombre: string;
  rol: string;
  tipo: 'Stakeholder' | 'Usuario' | '';
  area: string;
  nivelInfluencia: 'Alto' | 'Medio' | 'Bajo' | '';
  interesSistema: string;
  fechaRegistro?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StakeholderService {
  private stakeholdersSubject = new BehaviorSubject<Stakeholder[]>([]);
  public stakeholders$: Observable<Stakeholder[]> = this.stakeholdersSubject.asObservable();

  private readonly STORAGE_KEY = 'srs_stakeholders';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadFromStorage();
  }

  /**
   * Guardar stakeholder
   */
  saveStakeholder(stakeholder: Stakeholder): void {
    const stakeholders = this.stakeholdersSubject.value;
    const newStakeholder: Stakeholder = {
      ...stakeholder,
      id: this.generateId(),
      fechaRegistro: new Date()
    };
    
    const updated = [...stakeholders, newStakeholder];
    this.stakeholdersSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Actualizar stakeholder existente
   */
  updateStakeholder(id: string, stakeholder: Stakeholder): void {
    const stakeholders = this.stakeholdersSubject.value;
    const index = stakeholders.findIndex(s => s.id === id);
    
    if (index !== -1) {
      stakeholders[index] = { ...stakeholder, id };
      this.stakeholdersSubject.next([...stakeholders]);
      this.saveToStorage(stakeholders);
    }
  }

  /**
   * Eliminar stakeholder
   */
  deleteStakeholder(id: string): void {
    const stakeholders = this.stakeholdersSubject.value;
    const filtered = stakeholders.filter(s => s.id !== id);
    this.stakeholdersSubject.next(filtered);
    this.saveToStorage(filtered);
  }

  /**
   * Obtener stakeholder por ID
   */
  getStakeholderById(id: string): Stakeholder | undefined {
    return this.stakeholdersSubject.value.find(s => s.id === id);
  }

  /**
   * Obtener todos los stakeholders
   */
  getAllStakeholders(): Stakeholder[] {
    return this.stakeholdersSubject.value;
  }

  /**
   * Filtrar stakeholders por tipo
   */
  getStakeholdersByType(tipo: 'Stakeholder' | 'Usuario'): Stakeholder[] {
    return this.stakeholdersSubject.value.filter(s => s.tipo === tipo);
  }

  /**
   * Filtrar stakeholders por nivel de influencia
   */
  getStakeholdersByInfluence(nivel: 'Alto' | 'Medio' | 'Bajo'): Stakeholder[] {
    return this.stakeholdersSubject.value.filter(s => s.nivelInfluencia === nivel);
  }

  /**
   * Exportar stakeholders a JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.stakeholdersSubject.value, null, 2);
  }

  /**
   * Limpiar todos los stakeholders
   */
  clearAll(): void {
    this.stakeholdersSubject.next([]);
    if (this.isBrowser) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `SH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guardar en localStorage (solo en navegador)
   */
  private saveToStorage(stakeholders: Stakeholder[]): void {
    if (!this.isBrowser) {
      return; // No hacer nada en el servidor
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stakeholders));
    } catch (error) {
      console.error('Error al guardar stakeholders:', error);
    }
  }

  /**
   * Cargar desde localStorage (solo en navegador)
   */
  private loadFromStorage(): void {
    if (!this.isBrowser) {
      return; // No hacer nada en el servidor
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const stakeholders = JSON.parse(stored);
        this.stakeholdersSubject.next(stakeholders);
      }
    } catch (error) {
      console.error('Error al cargar stakeholders:', error);
    }
  }
}