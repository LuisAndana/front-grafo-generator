// src/app/features/srs/services/srs-generator.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Interfaces existentes ───────────────────────────────────────────────────
export interface Stakeholder {
  name: string;
  role: string;
  responsibility: string;
}

export interface User {
  backendId?: number;
  userId: string;
  userType: string;
  description: string;
}

export interface FunctionalRequirement {
  rfId: string;
  description: string;
  priority: string;
}

export interface NonFunctionalRequirement {
  rnfId: string;
  category: string;
  description: string;
}

export interface UseCase {
  backendId?: number;
  useCase: string;
  actors: string[];
  description: string;
  steps: string[];
}

export interface Constraint {
  backendId?: number;
  constraintId: string;
  description: string;
  type: string;
}

// ── Nuevas interfaces para módulos adicionales ──────────────────────────────
export interface EntrevistaItem {
  pregunta: string;
  respuesta?: string;
  observaciones?: string;
}

export interface ProcesoItem {
  nombre_proceso: string;
  descripcion?: string;
  problemas_detectados?: string;
}

export interface NecesidadItem {
  nombre: string;
}

export interface ElicitacionData {
  entrevistas: EntrevistaItem[];
  procesos: ProcesoItem[];
  necesidades: NecesidadItem[];
}

export interface NegociacionItem {
  nombre: string;
  descripcion: string;
  prioridad: string;
  aceptado: boolean;
}

export interface ValidacionInfo {
  aprobado?: boolean;
  aprobador?: string;
  observaciones?: string;
  checklist_rf?: boolean;
  checklist_rnf?: boolean;
  checklist_casos_uso?: boolean;
  checklist_restricciones?: boolean;
  checklist_prioridades?: boolean;
}

export interface ArtefactoInfo {
  nombre: string;
  categoria: string;
  descripcion?: string;
  nombre_archivo: string;
  ruta_archivo?: string;   // ruta en servidor para extraer contenido en PDF
  tipo_mime: string;
}

// ── Documento SRS completo ──────────────────────────────────────────────────
export interface SRSDocument {
  projectName: string;
  introduction: string;
  stakeholders: Stakeholder[];
  users: User[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  useCases: UseCase[];
  constraints: Constraint[];
  elicitacion: ElicitacionData;
  negociaciones: NegociacionItem[];
  validacionInfo: ValidacionInfo | null;
  artefactosInfo: ArtefactoInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class SrsGeneratorService {
  private apiUrl = 'http://localhost:8000/api/srs';

  constructor(private http: HttpClient) {}

  /**
   * Auto-genera un SRS completo desde TODOS los módulos del proyecto
   */
  autoGenerarSrs(proyectoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto-generar/${proyectoId}`, {});
  }

  /**
   * Crea un documento SRS en el backend y genera PDF
   */
  async generateSRSPdf(srsData: SRSDocument, proyectoId: number): Promise<void> {
    try {
      const payload = {
        proyecto_id: proyectoId,
        nombre_documento: srsData.projectName || 'SRS sin nombre',
        introduccion: srsData.introduction || '',
        stakeholders: srsData.stakeholders || [],
        usuarios: srsData.users || [],
        requerimientos_funcionales: srsData.functionalRequirements || [],
        requerimientos_no_funcionales: srsData.nonFunctionalRequirements || [],
        casos_uso: srsData.useCases || [],
        restricciones: srsData.constraints || [],
        elicitacion: srsData.elicitacion || null,
        negociaciones: srsData.negociaciones || [],
        validacion_info: srsData.validacionInfo || null,
        artefactos_info: srsData.artefactosInfo || [],
      };

      const response: any = await this.http.post(`${this.apiUrl}/`, payload).toPromise();

      if (response?.data?.id_srs) {
        const srsId = response.data.id_srs;
        setTimeout(() => {
          const pdfUrl = `${this.apiUrl}/generar-pdf/${srsId}?proyecto_id=${proyectoId}`;
          window.open(pdfUrl, '_blank');
        }, 500);
        alert('PDF generado correctamente. Se abrirá en una nueva pestaña.');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
      alert(`Error al generar SRS: ${errorMessage}`);
    }
  }

  getSrsByProyecto(proyectoId: number) {
    return this.http.get(`${this.apiUrl}/proyecto/${proyectoId}`);
  }

  getSrsById(srsId: number) {
    return this.http.get(`${this.apiUrl}/${srsId}`);
  }

  updateSrs(srsId: number, data: any) {
    return this.http.put(`${this.apiUrl}/${srsId}`, data);
  }

  deleteSrs(srsId: number) {
    return this.http.delete(`${this.apiUrl}/${srsId}`);
  }

  downloadPdf(srsId: number, proyectoId: number) {
    const pdfUrl = `${this.apiUrl}/generar-pdf/${srsId}?proyecto_id=${proyectoId}`;
    window.open(pdfUrl, '_blank');
  }
}
