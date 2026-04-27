// src/app/features/diagramas/components/tool-palette/tool-palette.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Tool, ToolGroup, TOOL_GROUPS } from '../../models/tools.model';
import { DiagramType } from '../../models/diagram.model';

@Component({
  selector: 'app-tool-palette',
  standalone: false,
  templateUrl: './tool-palette.component.html',
  styleUrls: ['./tool-palette.component.scss']
})
export class ToolPaletteComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly state = inject(DiagramStateService);

  toolGroups: ToolGroup[] = [];
  activeTool: Tool | null = null;

  ngOnInit(): void {
    combineLatest([this.state.diagram$, this.state.activeTool$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([diagram, tool]) => {
        if (diagram) {
          this.toolGroups = TOOL_GROUPS[diagram.type as DiagramType] ?? [];
        }
        this.activeTool = tool;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTool(tool: Tool): void {
    this.state.setActiveTool(this.activeTool?.id === tool.id ? null : tool);
  }

  isActive(tool: Tool): boolean {
    return this.activeTool?.id === tool.id;
  }

  onToolDragStart(event: DragEvent, tool: Tool): void {
    if (event.dataTransfer && tool.action === 'element' && tool.elementType) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'tool',
        toolId: tool.id,
        toolType: tool.elementType,
        toolLabel: tool.label
      }));
    }
  }

  onToolDragEnd(event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'none';
    }
  }
}
