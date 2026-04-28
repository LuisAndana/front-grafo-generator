// src/app/features/diagramas/services/diagram-state.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, debounceTime, skip, filter } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Diagram, DiagramElement, DiagramConnection, DiagramType, ViewTransform
} from '../models/diagram.model';
import { Tool } from '../models/tools.model';
import { ProyectoActivoService } from '../../../core/services/proyecto-activo.service';
import { DiagramaPersistenciaService, MetadatosDiagrama } from './diagrama-persistencia.service';

export interface SavedDiagramEntry {
  id: string;
  name: string;
  type: DiagramType;
  savedAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DiagramStateService {
  private readonly proyectoActivo = inject(ProyectoActivoService);
  private readonly persistencia = inject(DiagramaPersistenciaService);

  private readonly _diagram$ = new BehaviorSubject<Diagram | null>(null);
  private readonly _selectedElementId$ = new BehaviorSubject<string | null>(null);
  private readonly _activeTool$ = new BehaviorSubject<Tool | null>(null);
  private readonly _viewTransform$ = new BehaviorSubject<ViewTransform>({ x: 0, y: 0, scale: 1 });
  private readonly _connectionStart$ = new BehaviorSubject<{ elementId: string; port: 'n'|'e'|'s'|'w' } | null>(null);

  readonly diagram$ = this._diagram$.asObservable();
  readonly selectedElementId$ = this._selectedElementId$.asObservable();
  readonly activeTool$ = this._activeTool$.asObservable();
  readonly viewTransform$ = this._viewTransform$.asObservable();
  readonly connectionStart$ = this._connectionStart$.asObservable();

  readonly selectedElement$ = combineLatest([this._diagram$, this._selectedElementId$]).pipe(
    map(([diagram, id]) => diagram?.elements.find((e: DiagramElement) => e.id === id) ?? null)
  );

  readonly isConnectMode$ = this._activeTool$.pipe(
    map(tool => tool?.action === 'connect')
  );

  constructor() {
    // Auto-save 2s after any diagram change
    this._diagram$.pipe(
      skip(1),
      filter(d => d !== null),
      debounceTime(2000)
    ).subscribe(() => this.autoSave());
  }

  private autoSave(): void {
    const diagram = this._diagram$.value;
    if (!diagram) return;
    try {
      const storageKey = `diagram_${diagram.projectId}_${diagram.type}_${diagram.id}`;
      localStorage.setItem(storageKey, JSON.stringify(diagram));
      this.updateIndex(diagram);
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }

  private updateIndex(diagram: Diagram): void {
    const indexKey = `diagrams_${diagram.projectId}`;
    const index: SavedDiagramEntry[] = JSON.parse(localStorage.getItem(indexKey) || '[]');
    const existing = index.findIndex(d => d.id === diagram.id);
    const entry: SavedDiagramEntry = {
      id: diagram.id,
      name: diagram.name,
      type: diagram.type,
      savedAt: existing >= 0 ? index[existing].savedAt : new Date().toISOString(),
      updatedAt: diagram.updatedAt
    };
    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.unshift(entry);
    }
    localStorage.setItem(indexKey, JSON.stringify(index));
  }

  createDiagram(type: DiagramType, name: string): void {
    const proyecto = this.proyectoActivo.proyecto;
    const diagram: Diagram = {
      id: uuidv4(),
      projectId: proyecto?.id_proyecto?.toString() ?? 'unknown',
      name,
      type,
      elements: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this._diagram$.next(diagram);
    this._selectedElementId$.next(null);
    this._activeTool$.next(null);
  }

  loadDiagram(diagram: Diagram): void {
    const elementIds = new Set(diagram.elements.map(e => e.id));
    const validConnections = diagram.connections.filter(
      c => elementIds.has(c.sourceId) && elementIds.has(c.targetId)
    );
    this._diagram$.next({ ...diagram, connections: validConnections });
    this._selectedElementId$.next(null);
    this._activeTool$.next(null);
  }

  addElement(partial: Omit<DiagramElement, 'id'>): void {
    const current = this._diagram$.value;
    if (!current) return;
    const element: DiagramElement = { ...partial, id: uuidv4() };
    this._diagram$.next({
      ...current,
      elements: [...current.elements, element],
      updatedAt: new Date().toISOString()
    });
    this._selectedElementId$.next(element.id);
  }

  updateElement(id: string, changes: Partial<DiagramElement>): void {
    const current = this._diagram$.value;
    if (!current) return;
    this._diagram$.next({
      ...current,
      elements: current.elements.map((e: DiagramElement) => e.id === id ? { ...e, ...changes } : e),
      updatedAt: new Date().toISOString()
    });
  }

  removeElement(id: string): void {
    const current = this._diagram$.value;
    if (!current) return;
    this._diagram$.next({
      ...current,
      elements: current.elements.filter((e: DiagramElement) => e.id !== id),
      connections: current.connections.filter((c: DiagramConnection) => c.sourceId !== id && c.targetId !== id),
      updatedAt: new Date().toISOString()
    });
    if (this._selectedElementId$.value === id) this._selectedElementId$.next(null);
  }

  addConnection(connection: Omit<DiagramConnection, 'id'>): void {
    const current = this._diagram$.value;
    if (!current) return;
    const conn: DiagramConnection = { ...connection, id: uuidv4() };
    this._diagram$.next({
      ...current,
      connections: [...current.connections, conn],
      updatedAt: new Date().toISOString()
    });
    this._connectionStart$.next(null);
  }

  selectElement(id: string | null): void {
    this._selectedElementId$.next(id);
  }

  setActiveTool(tool: Tool | null): void {
    this._activeTool$.next(tool);
    if (tool?.action !== 'connect') this._connectionStart$.next(null);
  }

  setConnectionStart(elementId: string, port: 'n'|'e'|'s'|'w'): void {
    this._connectionStart$.next({ elementId, port });
  }

  updateViewTransform(transform: Partial<ViewTransform>): void {
    this._viewTransform$.next({ ...this._viewTransform$.value, ...transform });
  }

  getCurrentDiagram(): Diagram | null {
    return this._diagram$.value;
  }

  getSavedDiagrams(projectId: string): SavedDiagramEntry[] {
    try {
      const indexKey = `diagrams_${projectId}`;
      return JSON.parse(localStorage.getItem(indexKey) || '[]');
    } catch {
      return [];
    }
  }

  loadDiagramFromStorage(projectId: string, diagramId: string): Diagram | null {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`diagram_${projectId}_`) && key.endsWith(`_${diagramId}`)) {
          const data = localStorage.getItem(key);
          if (data) return JSON.parse(data);
        }
      }
      return null;
    } catch (error) {
      console.error('Error al cargar el diagrama desde storage:', error);
      return null;
    }
  }

  deleteSavedDiagram(projectId: string, diagramId: string, type: DiagramType): void {
    try {
      const storageKey = `diagram_${projectId}_${type}_${diagramId}`;
      localStorage.removeItem(storageKey);
      const indexKey = `diagrams_${projectId}`;
      const index: SavedDiagramEntry[] = JSON.parse(localStorage.getItem(indexKey) || '[]');
      localStorage.setItem(indexKey, JSON.stringify(index.filter(d => d.id !== diagramId)));
    } catch (error) {
      console.error('Error al eliminar diagrama:', error);
    }
  }

  saveDiagram(): boolean {
    try {
      const diagram = this._diagram$.value;
      if (!diagram) return false;
      const storageKey = `diagram_${diagram.projectId}_${diagram.type}_${diagram.id}`;
      localStorage.setItem(storageKey, JSON.stringify(diagram));
      this.updateIndex(diagram);
      this.guardarDiagramaEnBackend(diagram);
      console.log(`✓ Diagrama "${diagram.name}" guardado`);
      return true;
    } catch (error) {
      console.error('Error al guardar el diagrama:', error);
      return false;
    }
  }

  private guardarDiagramaEnBackend(diagram: Diagram): void {
    try {
      const proyecto = this.proyectoActivo.proyecto;
      if (!proyecto?.id_proyecto) return;
      const metadatos = this.extraerMetadatos(diagram);
      const codigoMermaid = this.generarCodigoMermaid(diagram);
      this.persistencia.guardarDiagrama({
        id_proyecto: proyecto.id_proyecto,
        tipo: diagram.type,
        nombre: diagram.name,
        descripcion: `Diagrama ${diagram.type} - ${diagram.name}`,
        metadatos,
        codigo_mermaid: codigoMermaid
      }).subscribe({
        next: (r) => console.log(`✓ Diagrama en BD: ${r.tipo} (ID: ${r.id_diagrama})`),
        error: (e) => console.warn('Guardado en localStorage pero falló BD:', e)
      });
    } catch (error) {
      console.warn('Error al preparar guardado en BD:', error);
    }
  }

  private extraerMetadatos(diagram: Diagram): MetadatosDiagrama {
    return {
      elementos: diagram.elements.length,
      relaciones: diagram.connections.length,
      tipos_elementos: [...new Set(diagram.elements.map((e: DiagramElement) => e.type))],
      tipos_relaciones: [...new Set(diagram.connections.map((c: DiagramConnection) => c.relationType || 'default'))],
      extra: {
        atributos_totales: diagram.elements.reduce((s, e: DiagramElement) => s + (e.attributes?.length || 0), 0),
        metodos_totales: diagram.elements.reduce((s, e: DiagramElement) => s + (e.methods?.length || 0), 0)
      }
    };
  }

  private generarCodigoMermaid(diagram: Diagram): string {
    const mapa: Record<string, string> = {
      class: 'classDiagram', sequence: 'sequenceDiagram',
      usecase: 'graph LR', package: 'graph TB'
    };
    let codigo = `${mapa[diagram.type] || 'graph LR'}\n`;
    diagram.elements.forEach((el: DiagramElement) => {
      if (diagram.type === 'class') {
        const attrs = el.attributes?.map(a => `  ${a.visibility}${a.name}:${a.type}`).join('\n') || '';
        const methods = el.methods?.map(m => `  ${m.visibility}${m.name}()`).join('\n') || '';
        codigo += `class ${el.label} {\n${[attrs, methods].filter(Boolean).join('\n')}\n}\n`;
      } else {
        codigo += `${el.type} : ${el.label}\n`;
      }
    });
    diagram.connections.forEach((conn: DiagramConnection) => {
      const src = diagram.elements.find(e => e.id === conn.sourceId)?.label || conn.sourceId;
      const tgt = diagram.elements.find(e => e.id === conn.targetId)?.label || conn.targetId;
      codigo += `${src} ${conn.relationType || '--'} ${tgt}\n`;
    });
    return codigo;
  }

  isDiagramSaved(): boolean {
    const diagram = this._diagram$.value;
    if (!diagram) return true;
    const storageKey = `diagram_${diagram.projectId}_${diagram.type}_${diagram.id}`;
    const saved = localStorage.getItem(storageKey);
    if (!saved) return false;
    try {
      return JSON.stringify(diagram) === JSON.stringify(JSON.parse(saved));
    } catch {
      return false;
    }
  }
}
