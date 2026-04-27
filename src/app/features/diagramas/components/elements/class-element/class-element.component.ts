// src/app/features/diagramas/components/elements/class-element/class-element.component.ts
import { Component, Input } from '@angular/core';
import { DiagramElement } from '../../../models/diagram.model';

@Component({
  selector: 'app-class-element',
  standalone: false,
  templateUrl: './class-element.component.html',
  styleUrls: ['./class-element.component.scss']
})
export class ClassElementComponent {
  @Input() element!: DiagramElement;
  @Input() stereotype?: string;

  get effectiveStereotype(): string | undefined {
    return this.stereotype ?? this.element.stereotype;
  }

  get headerH(): number {
    return this.effectiveStereotype ? 52 : 36;
  }

  get attrsH(): number {
    return Math.max(28, (this.element.attributes?.length ?? 0) * 20 + 8);
  }

  get methodsH(): number {
    return Math.max(28, (this.element.methods?.length ?? 0) * 20 + 8);
  }

  get totalH(): number {
    return this.headerH + this.attrsH + this.methodsH;
  }
}
