// Coincide exactamente con ProyectoResponse del backend
export interface Proyecto {
  id_proyecto: number;
  user_id: number;
  nombre: string;
  codigo: string;
  descripcion_problema: string;
  objetivo_general: string;
  fecha_inicio: string;       // "YYYY-MM-DD"
  analista_responsable: string;
  created_at: string;
  updated_at: string;
}

// Lo que se envía al crear
export interface ProyectoCreate {
  nombre: string;
  codigo: string;
  descripcion_problema: string;
  objetivo_general: string;
  fecha_inicio: string;
  analista_responsable: string;
}

// Lo que se envía al actualizar (campos opcionales)
export interface ProyectoUpdate {
  nombre?: string;
  codigo?: string;
  descripcion_problema?: string;
  objetivo_general?: string;
  fecha_inicio?: string;
  analista_responsable?: string;
}