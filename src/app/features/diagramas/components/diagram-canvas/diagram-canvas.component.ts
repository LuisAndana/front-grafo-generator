// src/app/features/diagramas/components/diagram-canvas/diagram-canvas.component.ts
import {
  Component, inject, OnInit, OnDestroy, ViewEncapsulation,
  ElementRef, HostListener
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Diagram, DiagramElement, DiagramConnection, ViewTransform } from '../../models/diagram.model';
import { Tool } from '../../models/tools.model';

@Component({
  selector: 'app-diagram-canvas',
  standalone: false,
  templateUrl: './diagram-canvas.component.html',
  styleUrls: ['./diagram-canvas.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DiagramCanvasComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly state = inject(DiagramStateService);
  private readonly elRef = inject(ElementRef);

  diagram: Diagram | null = null;
  viewTransform: ViewTransform = { x: 0, y: 0, scale: 1 };
  activeTool: Tool | null = null;
  selectedElementId: string | null = null;
  connectionStart: { elementId: string; port: 'n' | 'e' | 's' | 'w' } | null = null;
  hoveredElementId: string | null = null;

  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  isSpaceDown = false;

  get svgTransform(): string {
    const { x, y, scale } = this.viewTransform;
    return `translate(${x} ${y}) scale(${scale})`;
  }

  ngOnInit(): void {
    this.state.diagram$.pipe(takeUntil(this.destroy$)).subscribe(d => this.diagram = d);
    this.state.viewTransform$.pipe(takeUntil(this.destroy$)).subscribe(t => this.viewTransform = t);
    this.state.activeTool$.pipe(takeUntil(this.destroy$)).subscribe(t => this.activeTool = t);
    this.state.selectedElementId$.pipe(takeUntil(this.destroy$)).subscribe(id => this.selectedElementId = id);
    this.state.connectionStart$.pipe(takeUntil(this.destroy$)).subscribe(s => this.connectionStart = s);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.code === 'Space') { this.isSpaceDown = true; e.preventDefault(); }
    if ((e.code === 'Delete' || e.code === 'Backspace') && this.selectedElementId) {
      this.state.removeElement(this.selectedElementId);
    }
    if (e.code === 'Escape') {
      this.state.setActiveTool(null);
      this.state.selectElement(null);
    }
  }

  @HostListener('keyup', ['$event'])
  onKeyup(e: KeyboardEvent): void {
    if (e.code === 'Space') this.isSpaceDown = false;
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newScale = Math.max(0.25, Math.min(3, this.viewTransform.scale + delta));
    this.state.updateViewTransform({ scale: newScale });
  }

  onMouseDown(e: MouseEvent): void {
    if (e.button === 1 || (e.button === 0 && this.isSpaceDown)) {
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.viewTransform.x, y: e.clientY - this.viewTransform.y };
      e.preventDefault();
    }
  }

  onMouseMove(e: MouseEvent): void {
    if (this.isPanning) {
      this.state.updateViewTransform({
        x: e.clientX - this.panStart.x,
        y: e.clientY - this.panStart.y
      });
    }
  }

  onMouseUp(): void {
    this.isPanning = false;
  }

  onCanvasClick(e: MouseEvent): void {
    if (this.isPanning) return;
    if (!this.activeTool || this.activeTool.action !== 'element' || !this.activeTool.elementType) {
      this.state.selectElement(null);
      return;
    }
    const svg = this.elRef.nativeElement.querySelector('.canvas-svg') as SVGSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const { x, y, scale } = this.viewTransform;
    const nx = (svgPt.x - x) / scale;
    const ny = (svgPt.y - y) / scale;

    const isClass = this.activeTool.elementType === 'class' || this.activeTool.elementType === 'interface' || this.activeTool.elementType === 'enum';
    this.state.addElement({
      type: this.activeTool.elementType,
      x: nx - 80, y: ny - 50,
      width: this.activeTool.elementType === 'actor' ? 64 : 160,
      height: isClass ? 110 : (this.activeTool.elementType === 'usecase' ? 60 : 80),
      label: this.activeTool.label,
      attributes: isClass ? [] : undefined,
      methods: isClass ? [] : undefined,
      color: '#3F51B5'
    });
  }

  onElementClick(e: MouseEvent, element: DiagramElement): void {
    e.stopPropagation();
    if (this.activeTool?.action === 'connect') return;
    this.state.selectElement(element.id);
  }

  onPortClick(e: MouseEvent, elementId: string, port: 'n' | 'e' | 's' | 'w'): void {
    e.stopPropagation();
    if (!this.activeTool || this.activeTool.action !== 'connect' || !this.activeTool.relationType) return;
    if (!this.connectionStart) {
      this.state.setConnectionStart(elementId, port);
    } else if (this.connectionStart.elementId !== elementId) {
      this.state.addConnection({
        sourceId: this.connectionStart.elementId,
        targetId: elementId,
        sourcePort: this.connectionStart.port,
        targetPort: port,
        relationType: this.activeTool.relationType
      });
    }
  }

  onDragEnded(e: CdkDragEnd, element: DiagramElement): void {
    const { scale } = this.viewTransform;
    this.state.updateElement(element.id, {
      x: element.x + e.distance.x / scale,
      y: element.y + e.distance.y / scale
    });
    e.source.reset();
  }

  portPos(el: DiagramElement, port: 'n' | 'e' | 's' | 'w'): { cx: number; cy: number } {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const map = {
      n: { cx, cy: el.y },
      e: { cx: el.x + el.width, cy },
      s: { cx, cy: el.y + el.height },
      w: { cx: el.x, cy }
    };
    return map[port];
  }

  connectionPath(conn: DiagramConnection): string {
    const src = this.diagram?.elements.find(e => e.id === conn.sourceId);
    const tgt = this.diagram?.elements.find(e => e.id === conn.targetId);
    if (!src || !tgt) return '';
    const sp = this.portPos(src, conn.sourcePort);
    const tp = this.portPos(tgt, conn.targetPort);
    const dx = (tp.cx - sp.cx) / 2;
    const dy = (tp.cy - sp.cy) / 2;
    return `M ${sp.cx} ${sp.cy} C ${sp.cx + dx} ${sp.cy + dy} ${tp.cx - dx} ${tp.cy - dy} ${tp.cx} ${tp.cy}`;
  }

  isDashed(relationType: string): boolean {
    return ['dependency', 'realization', 'include', 'extend', 'return-message', 'async-message'].includes(relationType);
  }

  markerUrl(relationType: string): string {
    return `url(#marker-${relationType})`;
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onCanvasDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer || !this.diagram) return;

    try {
      const data = event.dataTransfer.getData('application/json');
      if (!data) return;

      const dragData = JSON.parse(data);

      if (dragData.type === 'tool') {
        const svg = this.elRef.nativeElement.querySelector('.canvas-svg') as SVGSVGElement;
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        const { x, y, scale } = this.viewTransform;
        const nx = (svgPt.x - x) / scale;
        const ny = (svgPt.y - y) / scale;

        const isClass = dragData.toolType === 'class' || dragData.toolType === 'interface' || dragData.toolType === 'enum';
        this.state.addElement({
          type: dragData.toolType,
          label: dragData.toolLabel,
          x: nx - 80,
          y: ny - 50,
          width: dragData.toolType === 'actor' ? 64 : 160,
          height: isClass ? 110 : (dragData.toolType === 'usecase' ? 60 : 80),
          color: '#3F51B5',
          attributes: isClass ? [] : undefined,
          methods: isClass ? [] : undefined
        });
      }
    } catch (e) {
      console.error('Error al procesar drop:', e);
    }
  }
}
