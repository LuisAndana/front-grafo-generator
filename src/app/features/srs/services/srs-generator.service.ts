// src/app/features/srs/services/srs-generator.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Stakeholder {
  name: string;
  role: string;
  responsibility: string;
}

export interface User {
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
  useCase: string;
  actors: string[];
  description: string;
  steps: string[];
}

export interface Constraint {
  constraintId: string;
  description: string;
  type: string;
}

export interface SRSDocument {
  projectName: string;
  introduction: string;
  stakeholders: Stakeholder[];
  users: User[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  useCases: UseCase[];
  constraints: Constraint[];
}

@Injectable({
  providedIn: 'root'
})
export class SrsGeneratorService {
  private apiUrl = 'http://localhost:8000/api/srs';

  constructor(private http: HttpClient) { }

  /**
   * Crea un documento SRS en el backend y genera PDF
   */
  async generateSRSPdf(srsData: SRSDocument, proyectoId: number): Promise<void> {
    try {
      // 1. Preparar datos para enviar al backend
      const payload = {
        proyecto_id: proyectoId,
        nombre_documento: srsData.projectName || 'SRS sin nombre',
        introduccion: srsData.introduction || '',
        stakeholders: srsData.stakeholders || [],
        usuarios: srsData.users || [],
        requerimientos_funcionales: srsData.functionalRequirements || [],
        requerimientos_no_funcionales: srsData.nonFunctionalRequirements || [],
        casos_uso: srsData.useCases || [],
        restricciones: srsData.constraints || []
      };

      console.log('Enviando SRS al backend:', payload);

      // 2. Crear SRS en el backend
      const response: any = await this.http.post(`${this.apiUrl}/`, payload).toPromise();

      if (response && response.data && response.data.id_srs) {
        const srsId = response.data.id_srs;
        console.log('SRS creado exitosamente con ID:', srsId);

        // 3. Generar y descargar PDF
        setTimeout(() => {
          const pdfUrl = `${this.apiUrl}/generar-pdf/${srsId}?proyecto_id=${proyectoId}`;
          console.log('Descargando PDF desde:', pdfUrl);
          window.open(pdfUrl, '_blank');
        }, 500);

        alert('✅ SRS creado exitosamente. El PDF se descargará en breve.');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error al generar SRS:', error);
      const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
      alert(`❌ Error al generar SRS: ${errorMessage}`);
    }
  }

  /**
   * Obtiene todos los SRS de un proyecto
   */
  getSrsByProyecto(proyectoId: number) {
    return this.http.get(`${this.apiUrl}/proyecto/${proyectoId}`);
  }

  /**
   * Obtiene un SRS específico
   */
  getSrsById(srsId: number) {
    return this.http.get(`${this.apiUrl}/${srsId}`);
  }

  /**
   * Actualiza un SRS
   */
  updateSrs(srsId: number, data: any) {
    return this.http.put(`${this.apiUrl}/${srsId}`, data);
  }

  /**
   * Elimina un SRS
   */
  deleteSrs(srsId: number) {
    return this.http.delete(`${this.apiUrl}/${srsId}`);
  }

  /**
   * Descarga el PDF de un SRS
   */
  downloadPdf(srsId: number, proyectoId: number) {
    const pdfUrl = `${this.apiUrl}/generar-pdf/${srsId}?proyecto_id=${proyectoId}`;
    window.open(pdfUrl, '_blank');
  }
}