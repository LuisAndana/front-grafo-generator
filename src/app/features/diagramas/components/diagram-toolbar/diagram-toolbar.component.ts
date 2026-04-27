// src/app/features/diagramas/components/diagram-toolbar/diagram-toolbar.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramExportService } from '../../services/diagram-export.service';
import { DiagramStorageService } from '../../services/diagram-storage.service';
import { Diagram, ViewTransform } from '../../models/diagram.model';

@Component({
  selector: 'app-diagram-toolbar',
  standalone: false,
  templateUrl: './diagram-toolbar.component.html',
  styleUrls: ['./diagram-toolbar.component.scss']
})
export class DiagramToolbarComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly state = inject(DiagramStateService);
  private readonly exportSvc = inject(DiagramExportService);
  private readonly storage = inject(DiagramStorageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  diagram: Diagram | null = null;
  viewTransform: ViewTransform = { x: 0, y: 0, scale: 1 };

  ngOnInit(): void {
    this.state.diagram$.pipe(takeUntil(this.destroy$)).subscribe(d => this.diagram = d);
    this.state.viewTransform$.pipe(takeUntil(this.destroy$)).subscribe(t => this.viewTransform = t);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get zoomPercent(): number {
    return Math.round(this.viewTransform.scale * 100);
  }

  zoomIn(): void {
    this.state.updateViewTransform({ scale: Math.min(this.viewTransform.scale + 0.1, 3) });
  }

  zoomOut(): void {
    this.state.updateViewTransform({ scale: Math.max(this.viewTransform.scale - 0.1, 0.25) });
  }

  resetZoom(): void {
    this.state.updateViewTransform({ x: 0, y: 0, scale: 1 });
  }

  save(): void {
    const d = this.state.getCurrentDiagram();
    if (!d) return;
    this.storage.save(d);
    this.snackBar.open('Diagrama guardado', undefined, { duration: 2000 });
  }

  async exportPng(): Promise<void> {
    const svg = document.querySelector('.canvas-svg') as SVGElement;
    if (!svg) return;
    await this.exportSvc.exportPng(svg, this.diagram?.name ?? 'diagram');
  }

  async exportPdf(): Promise<void> {
    const svg = document.querySelector('.canvas-svg') as SVGElement;
    if (!svg) return;
    await this.exportSvc.exportPdf(svg, this.diagram?.name ?? 'diagram');
  }

  goToSelector(): void {
    this.router.navigate(['/diagramas/selector']);
  }
}
