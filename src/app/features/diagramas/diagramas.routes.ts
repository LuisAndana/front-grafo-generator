// src/app/features/diagramas/diagramas.routes.ts
import { Routes } from '@angular/router';
import { DiagramSelectorComponent } from './components/diagram-selector/diagram-selector.component';
import { DiagramEditorComponent } from './pages/diagram-editor/diagram-editor.component';

export const DIAGRAMAS_ROUTES: Routes = [
  { path: '', redirectTo: 'selector', pathMatch: 'full' },
  { path: 'selector', component: DiagramSelectorComponent },
  { path: 'editor', component: DiagramEditorComponent }
];
