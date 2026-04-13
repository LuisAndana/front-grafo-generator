import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

@Component({
  selector: 'app-validacion-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './validacion-cliente.html',
  styleUrl: './validacion-cliente.css'
})
export class ValidacionCliente implements OnInit {

  private readonly BASE_URL = 'http://localhost:8000';

  proyectoId: number | null = null;
  validacionId: number | null = null;   // ID del registro en BD (null = aún no existe)

  checklist = {
    rf: false,
    rnf: false,
    casosUso: false,
    restricciones: false,
    prioridades: false
  };

  observaciones  = '';
  aprobador      = '';
  fecha          = '';
  firmaDigital   = '';
  aprobado       = false;

  // Estados UI
  isLoading   = false;
  isSaving    = false;
  successMsg  = '';
  errorMsg    = '';

  constructor(
    private http: HttpClient,
    private proyectoActivoSvc: ProyectoActivoService
  ) {}

  ngOnInit(): void {
    this.proyectoId = this.proyectoActivoSvc.proyectoId;
    if (this.proyectoId) this.cargarDesdeBackend();
  }

  // ── Carga ──────────────────────────────────────────────────────────────────

  private cargarDesdeBackend(): void {
    this.isLoading = true;

    this.http.get<any>(`${this.BASE_URL}/api/validacion/?proyecto_id=${this.proyectoId}`)
      .subscribe({
        next: (res) => {
          const data = Array.isArray(res) ? res[0] : res?.data ?? res;

          if (data && data.id_validacion) {
            this.validacionId = data.id_validacion;
            this.checklist = {
              rf:           data.checklist_rf          ?? false,
              rnf:          data.checklist_rnf         ?? false,
              casosUso:     data.checklist_casos_uso   ?? false,
              restricciones:data.checklist_restricciones ?? false,
              prioridades:  data.checklist_prioridades ?? false
            };
            this.observaciones  = data.observaciones   ?? '';
            this.aprobador      = data.aprobador        ?? '';
            this.fecha          = data.fecha            ?? '';
            this.firmaDigital   = data.firma_digital    ?? '';
            this.aprobado       = data.aprobado         ?? false;
          }

          this.isLoading = false;
        },
        error: () => {
          // 404 o error — no hay validación aún, empezamos vacío
          this.isLoading = false;
        }
      });
  }

  // ── Construcción del payload ───────────────────────────────────────────────

  private buildPayload(aprobar = false) {
    return {
      proyecto_id:              this.proyectoId,
      checklist_rf:             this.checklist.rf,
      checklist_rnf:            this.checklist.rnf,
      checklist_casos_uso:      this.checklist.casosUso,
      checklist_restricciones:  this.checklist.restricciones,
      checklist_prioridades:    this.checklist.prioridades,
      observaciones:            this.observaciones,
      aprobador:                this.aprobador,
      fecha:                    this.fecha || null,
      firma_digital:            this.firmaDigital,
      aprobado:                 aprobar ? true : this.aprobado
    };
  }

  // ── Guardar borrador ───────────────────────────────────────────────────────

  guardarBorrador(): void {
    this.persistir(false);
  }

  // ── Aprobar ────────────────────────────────────────────────────────────────

  aprobar(): void {
    if (!this.validarFormulario()) return;
    this.persistir(true);
  }

  private persistir(marcarAprobado: boolean): void {
    if (!this.proyectoId) return;

    this.isSaving  = true;
    this.successMsg = '';
    this.errorMsg   = '';

    const payload = this.buildPayload(marcarAprobado);

    const request$ = this.validacionId
      ? this.http.put<any>(`${this.BASE_URL}/api/validacion/${this.validacionId}`, payload)
      : this.http.post<any>(`${this.BASE_URL}/api/validacion/`, payload);

    request$.subscribe({
      next: (res) => {
        const data = res?.data ?? res;

        if (!this.validacionId && data?.id_validacion) {
          this.validacionId = data.id_validacion;
        }

        if (marcarAprobado) this.aprobado = true;

        this.isSaving   = false;
        this.successMsg = marcarAprobado ? '✓ Requerimientos aprobados correctamente' : '✓ Borrador guardado';
        setTimeout(() => { this.successMsg = ''; }, 3000);
      },
      error: (err) => {
        this.isSaving  = false;
        this.errorMsg  = err?.error?.detail ?? 'Error al guardar. Intenta de nuevo.';
        setTimeout(() => { this.errorMsg = ''; }, 5000);
      }
    });
  }

  // ── Reiniciar ──────────────────────────────────────────────────────────────

  limpiarValidacion(): void {
    if (!this.validacionId) { this.resetLocal(); return; }

    const payload = { ...this.buildPayload(false), aprobado: false,
      checklist_rf: false, checklist_rnf: false, checklist_casos_uso: false,
      checklist_restricciones: false, checklist_prioridades: false,
      observaciones: '', aprobador: '', fecha: null, firma_digital: '' };

    this.http.put<any>(`${this.BASE_URL}/api/validacion/${this.validacionId}`, payload)
      .subscribe({ next: () => this.resetLocal(), error: () => this.resetLocal() });
  }

  private resetLocal(): void {
    this.checklist    = { rf: false, rnf: false, casosUso: false, restricciones: false, prioridades: false };
    this.observaciones = '';
    this.aprobador    = '';
    this.fecha        = '';
    this.firmaDigital = '';
    this.aprobado     = false;
  }

  // ── Validación del formulario ──────────────────────────────────────────────

  validarFormulario(): boolean {
    return (
      this.checklist.rf &&
      this.checklist.rnf &&
      this.aprobador.trim() !== '' &&
      this.fecha !== ''
    );
  }
}
