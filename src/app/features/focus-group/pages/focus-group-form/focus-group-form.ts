import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FocusGroupSession, Participante, Objetivo, Requerimiento } from '../../../../core/models/focus-group.model';
import { FocusGroupService } from '../../../../core/services/focus-group.service';
@Component({
  selector: 'app-focus-group-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './focus-group-form.html',
  styleUrls: ['./focus-group-form.css']
})
export class FocusGroupFormComponent implements OnInit, OnDestroy {
  formFocusGroup: FormGroup;
  formParticipante: FormGroup;
  formObjetivo: FormGroup;
  formRequerimiento: FormGroup;

  focusGroupSeleccionado: FocusGroupSession | null = null;
  participantes_temp: Participante[] = [];
  objetivos_temp: Objetivo[] = [];
  requerimientos_temp: Requerimiento[] = [];

  editando = false;
  cargando = false;
  guardando = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private focusGroupService: FocusGroupService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formFocusGroup = this.crearFormFocusGroup();
    this.formParticipante = this.crearFormParticipante();
    this.formObjetivo = this.crearFormObjetivo();
    this.formRequerimiento = this.crearFormRequerimiento();
  }

  ngOnInit(): void {
    this.verificarSiEsEdicion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verificarSiEsEdicion(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.editando = true;
          this.cargarFocusGroup(params['id']);
        }
      });
  }

  cargarFocusGroup(id: string): void {
    this.cargando = true;
    this.focusGroupService.obtenerPorId(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fg) => {
          this.focusGroupSeleccionado = fg;
          this.cargarDatosEnFormularios(fg);
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error cargando focus group:', error);
          this.cargando = false;
          this.volver();
        }
      });
  }

  cargarDatosEnFormularios(fg: FocusGroupSession): void {
    this.formFocusGroup.patchValue({
      nombre_taller: fg.nombre_taller,
      fecha: fg.fecha,
      duracion: fg.duracion,
      moderador: fg.moderador,
      ubicacion: fg.ubicacion
    });
    this.participantes_temp = [...fg.participantes];
    this.objetivos_temp = [...fg.objetivos];
    this.requerimientos_temp = [...fg.requerimientos];
  }

  // ==================== FORMULARIOS ====================

  crearFormFocusGroup(): FormGroup {
    return this.fb.group({
      nombre_taller: ['', [Validators.required, Validators.minLength(3)]],
      fecha: ['', Validators.required],
      duracion: ['', [Validators.required, Validators.min(5)]],
      moderador: ['', Validators.required],
      ubicacion: ['', Validators.required]
    });
  }

  crearFormParticipante(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      rol: ['stakeholder', Validators.required],
      area: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      nivel_influencia: ['medio']
    });
  }

  crearFormObjetivo(): FormGroup {
    return this.fb.group({
      descripcion: ['', Validators.required]
    });
  }

  crearFormRequerimiento(): FormGroup {
    return this.fb.group({
      codigo: ['', Validators.required],
      descripcion: ['', Validators.required],
      prioridad: ['medio'],
      categoria: ['funcional']
    });
  }

  // ==================== PARTICIPANTES ====================

  agregarParticipante(): void {
    if (this.formParticipante.invalid) {
      alert('Por favor completa todos los campos del participante');
      return;
    }

    const participante: Participante = {
      id: `part-${Date.now()}`,
      ...this.formParticipante.value
    };

    this.participantes_temp.push(participante);
    this.formParticipante.reset();
    this.formParticipante.patchValue({ 
      rol: 'stakeholder',
      nivel_influencia: 'medio' 
    });
  }

  eliminarParticipante(id: string): void {
    this.participantes_temp = this.participantes_temp.filter(p => p.id !== id);
  }

  // ==================== OBJETIVOS ====================

  agregarObjetivo(): void {
    if (this.formObjetivo.invalid) {
      alert('Por favor ingresa la descripción del objetivo');
      return;
    }

    const objetivo: Objetivo = {
      id: `obj-${Date.now()}`,
      descripcion: this.formObjetivo.get('descripcion')?.value,
      temas: []
    };

    this.objetivos_temp.push(objetivo);
    this.formObjetivo.reset();
  }

  eliminarObjetivo(id: string): void {
    this.objetivos_temp = this.objetivos_temp.filter(o => o.id !== id);
  }

  // ==================== REQUERIMIENTOS ====================

  agregarRequerimiento(): void {
    if (this.formRequerimiento.invalid) {
      alert('Por favor completa todos los campos del requerimiento');
      return;
    }

    const requerimiento: Requerimiento = {
      id: `req-${Date.now()}`,
      ...this.formRequerimiento.value,
      participantes_mencionaron: 0
    };

    this.requerimientos_temp.push(requerimiento);
    this.formRequerimiento.reset();
    this.formRequerimiento.patchValue({ 
      prioridad: 'medio', 
      categoria: 'funcional' 
    });
  }

  eliminarRequerimiento(id: string): void {
    this.requerimientos_temp = this.requerimientos_temp.filter(r => r.id !== id);
  }

  // ==================== GUARDAR ====================

  guardar(): void {
    if (this.formFocusGroup.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (this.participantes_temp.length === 0) {
      alert('Debes agregar al menos un participante');
      return;
    }

    if (this.objetivos_temp.length === 0) {
      alert('Debes agregar al menos un objetivo');
      return;
    }

    this.guardando = true;

    if (this.editando && this.focusGroupSeleccionado) {
      this.actualizarFocusGroup();
    } else {
      this.crearFocusGroup();
    }
  }

  crearFocusGroup(): void {
    const nuevoFG: Omit<FocusGroupSession, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> = {
      ...this.formFocusGroup.value,
      estado: 'borrador',
      participantes: this.participantes_temp,
      objetivos: this.objetivos_temp,
      requerimientos: this.requerimientos_temp,
      captura_sesion: { documentos: [], ideas_claves: [], conflictos_identificados: [] }
    };

    this.focusGroupService.crear(nuevoFG)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fg) => {
          this.guardando = false;
          alert('Focus Group creado exitosamente');
          this.router.navigate(['/focus-group']);
        },
        error: (error) => {
          this.guardando = false;
          console.error('Error creando focus group:', error);
          alert('Error al crear el Focus Group');
        }
      });
  }

  actualizarFocusGroup(): void {
    if (!this.focusGroupSeleccionado) return;

    const fgActualizado: Partial<FocusGroupSession> = {
      ...this.formFocusGroup.value,
      participantes: this.participantes_temp,
      objetivos: this.objetivos_temp,
      requerimientos: this.requerimientos_temp
    };

    this.focusGroupService.actualizar(this.focusGroupSeleccionado.id, fgActualizado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fg) => {
          this.guardando = false;
          alert('Focus Group actualizado exitosamente');
          this.router.navigate(['/focus-group']);
        },
        error: (error) => {
          this.guardando = false;
          console.error('Error actualizando focus group:', error);
          alert('Error al actualizar el Focus Group');
        }
      });
  }

  volver(): void {
    this.router.navigate(['/focus-group']);
  }
}