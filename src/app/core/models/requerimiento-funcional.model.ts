// src/app/core/models/requerimiento-funcional.model.ts

export type Prioridad = 'Alta' | 'Media' | 'Baja';
export type EstadoRF  = 'Borrador' | 'En progreso' | 'Completado';

export interface RequerimientoFuncional {
  id_req:      number;
  proyecto_id: number | null;
  codigo:      string;
  descripcion: string;
  actor:       string | null;
  prioridad:   Prioridad;
  estado:      EstadoRF;
  created_at:  string;
  updated_at:  string;
}

export interface RequerimientoFuncionalCreate {
  proyecto_id: number | null;
  descripcion: string;
  actor:       string;
  prioridad:   Prioridad;
  estado:      EstadoRF;
}

export interface RequerimientoFuncionalUpdate {
  descripcion?: string;
  actor?:       string;
  prioridad?:   Prioridad;
  estado?:      EstadoRF;
}