// src/app/core/services/proyecto-activo.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ProyectoResumen {
  id_proyecto: number;
  nombre: string;
  codigo: string;
  descripcion_problema: string;
  objetivo_general: string;
  fecha_inicio: string;
  analista_responsable: string;
}

const STORAGE_KEY = 'srs_proyecto_activo';

@Injectable({ providedIn: 'root' })
export class ProyectoActivoService {

  private _proyecto$ = new BehaviorSubject<ProyectoResumen | null>(this._leerStorage());

  /** Observable que emite el proyecto activo (o null si no hay ninguno) */
  readonly proyecto$ = this._proyecto$.asObservable();

  /** Valor sincrónico del proyecto activo */
  get proyecto(): ProyectoResumen | null {
    return this._proyecto$.value;
  }

  get proyectoId(): number | null {
    return this._proyecto$.value?.id_proyecto ?? null;
  }

  /** Selecciona un proyecto y lo persiste */
  seleccionar(proyecto: ProyectoResumen): void {
    this._proyecto$.next(proyecto);
    this._guardarStorage(proyecto);
  }

  /** Limpia el proyecto activo */
  limpiar(): void {
    this._proyecto$.next(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  // ── storage helpers ──────────────────────────────────────────────────────

  private _leerStorage(): ProyectoResumen | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private _guardarStorage(p: ProyectoResumen): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  }
}