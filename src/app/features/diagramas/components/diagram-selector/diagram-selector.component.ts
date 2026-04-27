// src/app/features/diagramas/components/diagram-selector/diagram-selector.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramType } from '../../models/diagram.model';

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
export class DiagramSelectorComponent {
  private readonly router = inject(Router);
  private readonly diagramState = inject(DiagramStateService);

  readonly cards: DiagramCard[] = [
    {
      type: 'class',
      title: 'Diagrama de Clases',
      description: 'Modela la estructura estática: clases, interfaces, atributos, métodos y relaciones de herencia y composición.',
      icon: 'table_chart',
      color: '#3F51B5'
    },
    {
      type: 'sequence',
      title: 'Diagrama de Secuencia',
      description: 'Muestra cómo interactúan los objetos a lo largo del tiempo mediante mensajes y líneas de vida.',
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

  createDiagram(type: DiagramType): void {
    const names: Record<DiagramType, string> = {
      class: 'Diagrama de Clases',
      sequence: 'Diagrama de Secuencia',
      package: 'Diagrama de Paquetes',
      usecase: 'Casos de Uso'
    };
    this.diagramState.createDiagram(type, names[type] + ' — ' + new Date().toLocaleDateString('es'));
    this.router.navigate(['/diagramas/editor']);
  }
}
