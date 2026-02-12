export interface RequerimientoFuncional {
  codigo: string;
  descripcion: string;
  actor: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'Aprobado';
}
