// src/app/features/diagramas/services/diagram-storage.service.ts
import { Injectable, inject } from '@angular/core';
import { Diagram } from '../models/diagram.model';
import { ProyectoActivoService } from '../../../core/services/proyecto-activo.service';

@Injectable({ providedIn: 'root' })
export class DiagramStorageService {
  private readonly proyectoActivo = inject(ProyectoActivoService);

  private key(diagramId: string): string {
    const proyecto = this.proyectoActivo.proyecto;
    return `uml_diagram_${proyecto?.id_proyecto ?? 'default'}_${diagramId}`;
  }

  private indexKey(): string {
    const proyecto = this.proyectoActivo.proyecto;
    return `uml_diagram_index_${proyecto?.id_proyecto ?? 'default'}`;
  }

  save(diagram: Diagram): void {
    localStorage.setItem(this.key(diagram.id), JSON.stringify(diagram));
    const index = this.listIds();
    if (!index.includes(diagram.id)) {
      localStorage.setItem(this.indexKey(), JSON.stringify([...index, diagram.id]));
    }
  }

  load(diagramId: string): Diagram | null {
    const raw = localStorage.getItem(this.key(diagramId));
    return raw ? JSON.parse(raw) : null;
  }

  listIds(): string[] {
    const raw = localStorage.getItem(this.indexKey());
    return raw ? JSON.parse(raw) : [];
  }

  list(): Diagram[] {
    return this.listIds()
      .map(id => this.load(id))
      .filter((d): d is Diagram => d !== null);
  }

  delete(diagramId: string): void {
    localStorage.removeItem(this.key(diagramId));
    localStorage.setItem(this.indexKey(), JSON.stringify(this.listIds().filter(id => id !== diagramId)));
  }
}
