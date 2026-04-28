// src/app/features/diagramas/components/properties-panel/properties-panel.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramElement, ClassAttribute, ClassMethod } from '../../models/diagram.model';

@Component({
  selector: 'app-properties-panel',
  standalone: false,
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.scss']
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly state = inject(DiagramStateService);
  private readonly fb = inject(FormBuilder);

  element: DiagramElement | null = null;
  form!: FormGroup;
  isSaving = false;
  saveSuccess = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      label: [''],
      stereotype: [''],
      color: ['#3F51B5']
    });

    this.state.selectedElement$.pipe(takeUntil(this.destroy$)).subscribe(el => {
      this.element = el;
      if (el) {
        this.form.patchValue(
          { label: el.label, stereotype: el.stereotype ?? '', color: el.color ?? '#3F51B5' },
          { emitEvent: false }
        );
      }
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (this.element) {
        this.state.updateElement(this.element.id, {
          label: val.label,
          stereotype: val.stereotype,
          color: val.color
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addAttribute(): void {
    if (!this.element) return;
    const attr: ClassAttribute = { id: uuidv4(), visibility: '+', name: 'atributo', type: 'String' };
    this.state.updateElement(this.element.id, {
      attributes: [...(this.element.attributes ?? []), attr]
    });
  }

  removeAttribute(attrId: string): void {
    if (!this.element) return;
    this.state.updateElement(this.element.id, {
      attributes: this.element.attributes?.filter(a => a.id !== attrId)
    });
  }

  updateAttribute(attrId: string, field: keyof ClassAttribute, value: string): void {
    if (!this.element) return;
    this.state.updateElement(this.element.id, {
      attributes: this.element.attributes?.map(a => a.id === attrId ? { ...a, [field]: value } : a)
    });
  }

  addMethod(): void {
    if (!this.element) return;
    const method: ClassMethod = { id: uuidv4(), visibility: '+', name: 'metodo', returnType: 'void', params: '' };
    this.state.updateElement(this.element.id, {
      methods: [...(this.element.methods ?? []), method]
    });
  }

  removeMethod(methodId: string): void {
    if (!this.element) return;
    this.state.updateElement(this.element.id, {
      methods: this.element.methods?.filter(m => m.id !== methodId)
    });
  }

  updateMethod(methodId: string, field: keyof ClassMethod, value: string): void {
    if (!this.element) return;
    this.state.updateElement(this.element.id, {
      methods: this.element.methods?.map(m => m.id === methodId ? { ...m, [field]: value } : m)
    });
  }

  deleteElement(): void {
    if (!this.element) return;
    this.state.removeElement(this.element.id);
  }

  /**
   * Guardar todos los cambios del diagrama
   */
  saveDiagram(): void {
    this.isSaving = true;
    this.saveSuccess = false;

    // Simular un pequeño delay para mostrar que está guardando
    setTimeout(() => {
      const result = this.state.saveDiagram();
      this.isSaving = false;

      if (result) {
        this.saveSuccess = true;
        // Mostrar el mensaje de éxito por 3 segundos
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      }
    }, 300);
  }
}
