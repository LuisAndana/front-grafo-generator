// src/app/features/diagramas/components/diagram-selector/diagram-selector.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DiagramStateService, SavedDiagramEntry } from '../../services/diagram-state.service';
import { DiagramType } from '../../models/diagram.model';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

interface DiagramCard {
  type: DiagramType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-diagram-selector',
  standalone: false,
  templateUrl: './diagram-selector.component.html',
  styleUrls: ['./diagram-selector.component.scss']
})
export class DiagramSelectorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly diagramState = inject(DiagramStateService);
  private readonly proyectoActivo = inject(ProyectoActivoService);

  readonly cards: DiagramCard[] = [
    {
      type: 'class',
      title: 'Diagrama de Clases',
      description: 'Modela la estructura estática: clases, interfaces, atributos, métodos y relaciones.',
      icon: 'table_chart',
      color: '#3F51B5'
    },
    {
      type: 'sequence',
      title: 'Diagrama de Secuencia',
      description: 'Muestra cómo interactúan los objetos a lo largo del tiempo mediante mensajes.',
      icon: 'view_week',
      color: '#009688'
    },
    {
      type: 'package',
      title: 'Diagrama de Paquetes',
      description: 'Organiza los elementos del sistema en paquetes y muestra sus dependencias.',
      icon: 'folder_open',
      color: '#FF9800'
    },
    {
      type: 'usecase',
      title: 'Casos de Uso',
      description: 'Define la funcionalidad del sistema desde la perspectiva de los actores externos.',
      icon: 'person_pin',
      color: '#E91E63'
    }
  ];

  readonly typeConfig: Record<DiagramType, { icon: string; color: string }> = {
    class:    { icon: 'table_chart',  color: '#3F51B5' },
    sequence: { icon: 'view_week',    color: '#009688' },
    package:  { icon: 'folder_open',  color: '#FF9800' },
    usecase:  { icon: 'person_pin',   color: '#E91E63' }
  };

  savedDiagrams: SavedDiagramEntry[] = [];

  ngOnInit(): void {
    this.refreshSavedDiagrams();
  }

  private get projectId(): string {
    return this.proyectoActivo.proyecto?.id_proyecto?.toString() ?? 'unknown';
  }

  refreshSavedDiagrams(): void {
    this.savedDiagrams = this.diagramState.getSavedDiagrams(this.projectId);
  }

  createDiagram(type: DiagramType): void {
    const names: Record<DiagramType, string> = {
      class:    'Diagrama de Clases',
      sequence: 'Diagrama de Secuencia',
      package:  'Diagrama de Paquetes',
      usecase:  'Casos de Uso'
    };
    this.diagramState.createDiagram(type, names[type] + ' — ' + new Date().toLocaleDateString('es'));
    this.router.navigate(['/diagramas/editor']);
  }

  openDiagram(entry: SavedDiagramEntry): void {
    const diagram = this.diagramState.loadDiagramFromStorage(this.projectId, entry.id);
    if (diagram) {
      this.diagramState.loadDiagram(diagram);
      this.router.navigate(['/diagramas/editor']);
    }
  }

  deleteDiagram(entry: SavedDiagramEntry, event: Event): void {
    event.stopPropagation();
    this.diagramState.deleteSavedDiagram(this.projectId, entry.id, entry.type);
    this.refreshSavedDiagrams();
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('es', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }
}
