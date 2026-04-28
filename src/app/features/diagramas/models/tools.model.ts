// src/app/features/diagramas/models/tools.model.ts
import { DiagramType, ElementType, RelationType } from './diagram.model';

export interface Tool {
  id: string;
  label: string;
  icon: string;
  tooltip: string;
  action: 'element' | 'connect' | 'select' | 'pan';
  elementType?: ElementType;
  relationType?: RelationType;
}

export interface ToolGroup {
  label: string;
  tools: Tool[];
}

export const TOOL_GROUPS: Record<DiagramType, ToolGroup[]> = {
  class: [
    {
      label: 'Selección',
      tools: [
        { id: 'select', label: 'Seleccionar', icon: 'arrow_selector_tool', tooltip: 'Seleccionar elementos', action: 'select' },
        { id: 'pan', label: 'Mover', icon: 'pan_tool', tooltip: 'Desplazar canvas (Espacio + drag)', action: 'pan' },
      ]
    },
    {
      label: 'Elementos',
      tools: [
        { id: 'class', label: 'Clase', icon: 'table_chart', tooltip: 'Añadir clase', action: 'element', elementType: 'class' },
        { id: 'interface', label: 'Interfaz', icon: 'token', tooltip: 'Añadir interfaz', action: 'element', elementType: 'interface' },
        { id: 'enum', label: 'Enum', icon: 'format_list_numbered', tooltip: 'Añadir enumeración', action: 'element', elementType: 'enum' },
      ]
    },
    {
      label: 'Relaciones',
      tools: [
        { id: 'inheritance', label: 'Herencia', icon: 'call_merge', tooltip: 'Herencia (──▷)', action: 'connect', relationType: 'inheritance' },
        { id: 'association', label: 'Asociación', icon: 'horizontal_rule', tooltip: 'Asociación (──)', action: 'connect', relationType: 'association' },
        { id: 'aggregation', label: 'Agregación', icon: 'diamond', tooltip: 'Agregación (──◇)', action: 'connect', relationType: 'aggregation' },
        { id: 'composition', label: 'Composición', icon: 'fiber_manual_record', tooltip: 'Composición (──◆)', action: 'connect', relationType: 'composition' },
        { id: 'dependency', label: 'Dependencia', icon: 'arrow_right_alt', tooltip: 'Dependencia (- - ▷)', action: 'connect', relationType: 'dependency' },
        { id: 'realization', label: 'Realización', icon: 'arrow_outward', tooltip: 'Realización (- -▷)', action: 'connect', relationType: 'realization' },
      ]
    }
  ],
  sequence: [
    {
      label: 'Selección',
      tools: [
        { id: 'select', label: 'Seleccionar', icon: 'arrow_selector_tool', tooltip: 'Seleccionar', action: 'select' },
      ]
    },
    {
      label: 'Participantes',
      tools: [
        { id: 'actor', label: 'Actor', icon: 'person', tooltip: 'Añadir actor', action: 'element', elementType: 'actor' },
        { id: 'lifeline', label: 'Línea vida', icon: 'view_week', tooltip: 'Añadir objeto/línea de vida', action: 'element', elementType: 'lifeline' },
        { id: 'activation', label: 'Activación', icon: 'rectangle', tooltip: 'Activación en línea de vida', action: 'element', elementType: 'activation' },
      ]
    },
    {
      label: 'Mensajes',
      tools: [
        { id: 'sync-message', label: 'Síncrono', icon: 'arrow_forward', tooltip: 'Mensaje síncrono (──►)', action: 'connect', relationType: 'sync-message' },
        { id: 'async-message', label: 'Asíncrono', icon: 'arrow_right_alt', tooltip: 'Mensaje asíncrono', action: 'connect', relationType: 'async-message' },
        { id: 'return-message', label: 'Retorno', icon: 'arrow_back', tooltip: 'Retorno (◄──)', action: 'connect', relationType: 'return-message' },
      ]
    }
  ],
  package: [
    {
      label: 'Selección',
      tools: [{ id: 'select', label: 'Seleccionar', icon: 'arrow_selector_tool', tooltip: 'Seleccionar', action: 'select' }]
    },
    {
      label: 'Elementos',
      tools: [
        { id: 'package', label: 'Paquete', icon: 'folder', tooltip: 'Añadir paquete', action: 'element', elementType: 'package' },
        { id: 'subpackage', label: 'Subpaquete', icon: 'folder_open', tooltip: 'Añadir subpaquete', action: 'element', elementType: 'subpackage' },
        { id: 'class', label: 'Clase', icon: 'table_chart', tooltip: 'Añadir clase', action: 'element', elementType: 'class' },
      ]
    },
    {
      label: 'Relaciones',
      tools: [
        { id: 'dependency', label: 'Dependencia', icon: 'arrow_right_alt', tooltip: 'Dependencia (- - ▷)', action: 'connect', relationType: 'dependency' },
        { id: 'import', label: 'Importación', icon: 'input', tooltip: 'Importación de elementos', action: 'connect', relationType: 'import' },
        { id: 'access', label: 'Acceso', icon: 'check_circle', tooltip: 'Acceso a elementos', action: 'connect', relationType: 'access' },
      ]
    }
  ],
  usecase: [
    {
      label: 'Selección',
      tools: [{ id: 'select', label: 'Seleccionar', icon: 'arrow_selector_tool', tooltip: 'Seleccionar', action: 'select' }]
    },
    {
      label: 'Elementos',
      tools: [
        { id: 'actor', label: 'Actor', icon: 'person', tooltip: 'Añadir actor', action: 'element', elementType: 'actor' },
        { id: 'usecase', label: 'Caso de Uso', icon: 'radio_button_unchecked', tooltip: 'Añadir caso de uso', action: 'element', elementType: 'usecase' },
        { id: 'system-boundary', label: 'Sistema', icon: 'crop_square', tooltip: 'Límite del sistema', action: 'element', elementType: 'system-boundary' },
      ]
    },
    {
      label: 'Relaciones',
      tools: [
        { id: 'association', label: 'Asociación', icon: 'horizontal_rule', tooltip: 'Asociación', action: 'connect', relationType: 'association' },
        { id: 'include', label: 'Include', icon: 'subdirectory_arrow_right', tooltip: '«include»', action: 'connect', relationType: 'include' },
        { id: 'extend', label: 'Extend', icon: 'call_split', tooltip: '«extend»', action: 'connect', relationType: 'extend' },
        { id: 'generalization', label: 'Generalización', icon: 'call_merge', tooltip: 'Generalización (herencia)', action: 'connect', relationType: 'generalization' },
      ]
    }
  ]
};
