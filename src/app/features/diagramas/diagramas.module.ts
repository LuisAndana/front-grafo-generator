// src/app/features/diagramas/diagramas.module.ts
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DIAGRAMAS_ROUTES } from './diagramas.routes';
import { DiagramEditorComponent } from './pages/diagram-editor/diagram-editor.component';
import { DiagramSelectorComponent } from './components/diagram-selector/diagram-selector.component';
import { DiagramCanvasComponent } from './components/diagram-canvas/diagram-canvas.component';
import { DiagramToolbarComponent } from './components/diagram-toolbar/diagram-toolbar.component';
import { ToolPaletteComponent } from './components/tool-palette/tool-palette.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { ClassElementComponent } from './components/elements/class-element/class-element.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(DIAGRAMAS_ROUTES),
    ReactiveFormsModule,
    DragDropModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  declarations: [
    DiagramEditorComponent,
    DiagramSelectorComponent,
    DiagramCanvasComponent,
    DiagramToolbarComponent,
    ToolPaletteComponent,
    PropertiesPanelComponent,
    ClassElementComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class DiagramasModule {}
