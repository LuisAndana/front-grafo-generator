import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialService } from '../../../../core/services/historial.service';

@Component({
  standalone: true,
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css'],
  imports: [CommonModule]
})
export class HistorialComponent {

  historial: any[] = [];
  expandedId: string | null = null; // 🔥 ESTA PROPIEDAD FALTABA
  
  constructor(private historialService: HistorialService) {
    this.historial = this.historialService.obtenerHistorial();
  }

  // 🔥 ESTE MÉTODO FALTABA
  toggle(item: any) {
    this.expandedId = this.expandedId === item.id ? null : item.id;
  }
}
