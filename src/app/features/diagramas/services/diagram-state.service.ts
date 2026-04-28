// src/app/features/diagramas/services/diagram-state.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Diagram, DiagramElement, DiagramConnection, DiagramType, ViewTransform
} from '../models/diagram.model';
import { Tool } from '../models/tools.model';
import { ProyectoActivoService } from '../../../core/services/proyecto-activo.service';

@Injectable({ providedIn: 'root' })
export class DiagramStateService {
  private readonly proyectoActivo = inject(ProyectoActivoService);

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
    this._diagram$.next({ ...diagram });
    this._selectedElementId$.next(null);
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

  /**
   * Guardar el diagrama actual en localStorage
   * @returns true si se guardó correctamente, false si hay error
   */
  saveDiagram(): boolean {
    try {
      const diagram = this._diagram$.value;
      if (!diagram) {
        console.warn('No diagram to save');
        return false;
      }

      // Guardar en localStorage con clave única por proyecto y tipo de diagrama
      const storageKey = `diagram_${diagram.projectId}_${diagram.type}_${diagram.id}`;
      localStorage.setItem(storageKey, JSON.stringify(diagram));

      // También guardar un índice de diagramas guardados
      const indexKey = `diagrams_${diagram.projectId}`;
      const savedDiagrams = JSON.parse(localStorage.getItem(indexKey) || '[]');
      if (!savedDiagrams.find((d: any) => d.id === diagram.id)) {
        savedDiagrams.push({
          id: diagram.id,
          name: diagram.name,
          type: diagram.type,
          savedAt: new Date().toISOString()
        });
        localStorage.setItem(indexKey, JSON.stringify(savedDiagrams));
      }

      // Actualizar el timestamp de guardado
      this._diagram$.next({
        ...diagram,
        savedAt: new Date().toISOString()
      });

      console.log(`✓ Diagrama "${diagram.name}" guardado exitosamente`);
      return true;
    } catch (error) {
      console.error('Error al guardar el diagrama:', error);
      return false;
    }
  }

  /**
   * Cargar un diagrama desde localStorage
   */
  loadDiagramFromStorage(projectId: string, diagramId: string): Diagram | null {
    try {
      const storageKey = `diagram_${projectId}_*_${diagramId}`;
      // Buscar la clave exacta (puede tener el tipo en el medio)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`diagram_${projectId}_`) && key.endsWith(`_${diagramId}`)) {
          const data = localStorage.getItem(key);
          if (data) {
            return JSON.parse(data);
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error al cargar el diagrama desde storage:', error);
      return null;
    }
  }

  /**
   * Obtener el estado de guardado del diagrama actual
   */
  isDiagramSaved(): boolean {
    const diagram = this._diagram$.value;
    if (!diagram) return true;

    const storageKey = `diagram_${diagram.projectId}_${diagram.type}_${diagram.id}`;
    const saved = localStorage.getItem(storageKey);
    if (!saved) return false;

    try {
      const savedDiagram = JSON.parse(saved);
      return JSON.stringify(diagram) === JSON.stringify(savedDiagram);
    } catch {
      return false;
    }
  }
}
