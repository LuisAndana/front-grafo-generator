// src/app/features/diagramas/models/diagram.model.ts
export type DiagramType = 'class' | 'sequence' | 'package' | 'usecase';

export type RelationType =
  | 'inheritance' | 'association' | 'aggregation' | 'composition'
  | 'dependency' | 'realization' | 'include' | 'extend' | 'generalization'
  | 'sync-message' | 'async-message' | 'return-message'
  | 'import' | 'access';

export type ElementType =
  | 'class' | 'interface' | 'enum'
  | 'actor' | 'lifeline' | 'activation'
  | 'package' | 'subpackage'
  | 'usecase' | 'system-boundary';

export interface ClassAttribute {
  id: string;
  visibility: '+' | '-' | '#' | '~';
  name: string;
  type: string;
}

export interface ClassMethod {
  id: string;
  visibility: '+' | '-' | '#' | '~';
  name: string;
  returnType: string;
  params: string;
}

export interface DiagramElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  stereotype?: string;
  color?: string;
  attributes?: ClassAttribute[];
  methods?: ClassMethod[];
}

export interface DiagramConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort: 'n' | 'e' | 's' | 'w';
  targetPort: 'n' | 'e' | 's' | 'w';
  relationType: RelationType;
  label?: string;
  color?: string;
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export interface Diagram {
  id: string;
  projectId: string;
  name: string;
  type: DiagramType;
  elements: DiagramElement[];
  connections: DiagramConnection[];
  createdAt: string;
  updatedAt: string;
}
