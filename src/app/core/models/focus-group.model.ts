export interface Participante {
  id: string;
  nombre: string;
  rol: 'stakeholder' | 'usuario_final' | 'tecnico';
  area: string;
  email: string;
  nivel_influencia: 'bajo' | 'medio' | 'alto';
}

export interface Objetivo {
  id: string;
  descripcion: string;
  temas: string[];
}

export interface Requerimiento {
  id: string;
  codigo: string;
  descripcion: string;
  prioridad: 'bajo' | 'medio' | 'alto';
  categoria: 'funcional' | 'no_funcional' | 'tecnico';
  participantes_mencionaron: number;
}

export interface CapturaSesion {
  documentos: string[];
  ideas_claves: string[];
  conflictos_identificados: string[];
}

export interface FocusGroupSession {
  id: string;
  nombre_taller: string;
  fecha: string;
  duracion: number; // en minutos
  moderador: string;
  ubicacion: string;
  estado: 'borrador' | 'activo' | 'completado';
  participantes: Participante[];
  objetivos: Objetivo[];
  requerimientos: Requerimiento[];
  captura_sesion: CapturaSesion;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface FocusGroupResponse {
  success: boolean;
  data?: FocusGroupSession | FocusGroupSession[];
  message?: string;
  error?: string;
}