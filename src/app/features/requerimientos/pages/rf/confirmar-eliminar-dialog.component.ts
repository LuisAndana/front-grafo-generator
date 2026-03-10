// src/app/features/requerimientos/pages/rf/confirmar-eliminar-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirmar-eliminar-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <!-- Header con icono de advertencia -->
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning_amber</mat-icon>
      </div>

      <!-- Contenido -->
      <div class="dialog-content">
        <h2 class="dialog-title">¿Eliminar Requerimiento?</h2>
        
        <div class="requirement-info">
          <p class="codigo">
            <span class="label">Código:</span>
            <span class="value">{{ data.codigo }}</span>
          </p>
          <p class="descripcion">
            <span class="label">Descripción:</span>
            <span class="value">{{ data.descripcion }}</span>
          </p>
        </div>

        <p class="warning-text">
          <strong>Esta acción es irreversible.</strong> El requerimiento se eliminará permanentemente de la base de datos.
        </p>
      </div>

      <!-- Acciones -->
      <div class="dialog-actions">
        <button 
          mat-stroked-button 
          (click)="cancelar()" 
          class="btn-cancel">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="warn" 
          (click)="confirmar()" 
          class="btn-delete">
          <mat-icon>delete</mat-icon>
          Eliminar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --dialog-header-bg: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      --dialog-header-color: #ffffff;
      --dialog-title-color: var(--neutral-900);
      --dialog-text-color: var(--neutral-600);
      --dialog-warning-bg: var(--error-light);
      --dialog-warning-text: var(--error-text);
      --dialog-info-bg: var(--neutral-100);
      --dialog-info-border: var(--neutral-300);
    }

    .dialog-container {
      padding: 0;
      font-family: var(--font-family-base);
      overflow: hidden;
      border-radius: var(--border-radius-2xl);
    }

    /* ============================================
       HEADER
       ============================================ */
    
    .dialog-header {
      background: var(--dialog-header-bg);
      padding: var(--spacing-2xl) var(--spacing-lg);
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .dialog-header::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(50px, -50px);
    }

    .warning-icon {
      font-size: 52px !important;
      width: 52px !important;
      height: 52px !important;
      color: var(--dialog-header-color);
      position: relative;
      z-index: 1;
      animation: pulse 2s ease-in-out infinite;
    }

    /* ============================================
       CONTENIDO
       ============================================ */

    .dialog-content {
      padding: var(--spacing-2xl) var(--spacing-xl);
      text-align: left;
      background: #ffffff;
    }

    .dialog-title {
      margin: 0 0 var(--spacing-lg) 0;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-semibold);
      color: var(--dialog-title-color);
      line-height: var(--line-height-tight);
    }

    /* ============================================
       INFORMACIÓN DEL REQUERIMIENTO
       ============================================ */

    .requirement-info {
      background-color: var(--dialog-info-bg);
      border-left: var(--border-width-4) solid var(--error-color);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--spacing-lg);
      backdrop-filter: blur(10px);
    }

    .codigo,
    .descripcion {
      margin: var(--spacing-md) 0;
      font-size: var(--font-size-sm);
      color: var(--dialog-text-color);
      line-height: var(--line-height-normal);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .label {
      font-weight: var(--font-weight-semibold);
      color: var(--neutral-700);
      display: block;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--error-text);
    }

    .value {
      font-weight: var(--font-weight-normal);
      color: var(--neutral-900);
      word-break: break-word;
      background: rgba(255, 255, 255, 0.6);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--border-radius-md);
      border-left: 2px solid var(--error-color);
      padding-left: var(--spacing-md);
    }

    /* ============================================
       ADVERTENCIA
       ============================================ */

    .warning-text {
      color: var(--dialog-warning-text);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
      margin: 0;
      padding: var(--spacing-lg);
      background-color: var(--dialog-warning-bg);
      border-radius: var(--border-radius-lg);
      border-left: var(--border-width-4) solid var(--error-color);
    }

    .warning-text strong {
      color: var(--error-color);
      font-weight: var(--font-weight-semibold);
    }

    /* ============================================
       ACCIONES
       ============================================ */

    .dialog-actions {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-xl);
      background: linear-gradient(to right, var(--neutral-50), #ffffff);
      border-top: var(--border-width) solid var(--neutral-200);
      justify-content: flex-end;
    }

    .btn-cancel {
      min-width: 140px;
      color: var(--neutral-600) !important;
      border-color: var(--neutral-300) !important;
      font-weight: var(--font-weight-medium);
      transition: all var(--transition-base);
    }

    .btn-cancel:hover {
      border-color: var(--neutral-400) !important;
      background-color: var(--neutral-100) !important;
      color: var(--neutral-700) !important;
    }

    .btn-cancel mat-icon {
      margin-right: var(--spacing-sm);
    }

    .btn-delete {
      min-width: 140px;
      background-color: var(--error-color) !important;
      color: #ffffff !important;
      font-weight: var(--font-weight-medium);
      box-shadow: var(--shadow-md);
      transition: all var(--transition-base);
    }

    .btn-delete:hover {
      background-color: #dc2626 !important;
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .btn-delete:active {
      transform: translateY(0);
    }

    .btn-delete mat-icon {
      margin-right: var(--spacing-sm);
    }

    button {
      text-transform: none;
      font-size: var(--font-size-sm);
      border-radius: var(--border-radius-md);
      cursor: pointer;
    }

    /* ============================================
       ANIMACIÓN ENTRADA
       ============================================ */

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    :host {
      display: block;
      animation: slideDown var(--transition-base) ease-out;
    }

    /* ============================================
       RESPONSIVO
       ============================================ */

    @media (max-width: 600px) {
      .dialog-content {
        padding: var(--spacing-lg) var(--spacing-md);
      }

      .dialog-actions {
        flex-direction: column-reverse;
        gap: var(--spacing-sm);
        padding: var(--spacing-lg) var(--spacing-md);
      }

      .btn-cancel,
      .btn-delete {
        width: 100%;
        min-width: auto;
      }

      .dialog-title {
        font-size: var(--font-size-xl);
      }
    }
  `]
})
export class ConfirmarEliminarDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmarEliminarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { codigo: string; descripcion: string }
  ) {}

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}