// src/app/features/diagramas/pages/diagram-editor/diagram-editor.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
  selector: 'app-diagram-editor',
  standalone: false,
  templateUrl: './diagram-editor.component.html',
  styleUrls: ['./diagram-editor.component.scss']
})
export class DiagramEditorComponent implements OnInit {
  private readonly state = inject(DiagramStateService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const sub = this.state.diagram$.subscribe(d => {
      if (!d) this.router.navigate(['/diagramas/selector']);
    });
    sub.unsubscribe();
  }
}
