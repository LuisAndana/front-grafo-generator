// src/app/features/srs/pages/srs-generator/srs-generator.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SrsGeneratorService, SRSDocument } from '../../services/srs-generator.service';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-srs-generator',
  standalone: false,
  templateUrl: './srs-generator.component.html',
  styleUrls: ['./srs-generator.component.css']
})
export class SrsGeneratorComponent implements OnInit, OnDestroy {

  srsData: SRSDocument = {
    projectName: '',
    introduction: '',
    stakeholders: [],
    users: [],
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    useCases: [],
    constraints: []
  };

  activeTab: string = 'introduction';
  proyectoId: number | null = null;
  proyectoNombre: string = '';
  proyectoCodigo: string = '';
  isLoading: boolean = false;
  isLoadingProject: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private srsService: SrsGeneratorService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private proyectoActivoService: ProyectoActivoService
  ) { }

  ngOnInit(): void {
    console.log('🚀 [SRS-GENERATOR] ngOnInit iniciando...');
    console.log('🔍 [SRS-GENERATOR] Buscando ID del proyecto...');
    
    this.obtenerProyectoIdDelBackend();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Obtiene el ID del proyecto del servicio ProyectoActivoService
   */
  private obtenerProyectoIdDelBackend(): void {
    console.log('💾 [SRS-GENERATOR] Obteniendo ID del ProyectoActivoService...');
    
    const proyectoActivo = this.proyectoActivoService.proyectoId;
    
    console.log('📌 [SRS-GENERATOR] proyectoId del servicio:', proyectoActivo);
    
    if (proyectoActivo) {
      this.proyectoId = Number(proyectoActivo);
      console.log('✓ [SRS-GENERATOR] ✓ Proyecto ID obtenido:', this.proyectoId);
      this.cargarTodosLosDatos();
      return;
    }

    console.log('⚠️ [SRS-GENERATOR] No hay ID en ProyectoActivoService, intentando otras fuentes...');
    this.obtenerProyectoIdDeOtrasFuentes();
  }

  /**
   * Intenta obtener el ID de otras fuentes como fallback
   */
  private obtenerProyectoIdDeOtrasFuentes(): void {
    this.route.params.subscribe((params: any) => {
      console.log('📌 [SRS-GENERATOR] Route params:', params);
      
      if (params && params['proyectoId']) {
        this.proyectoId = parseInt(params['proyectoId'], 10);
        console.log('✓ [SRS-GENERATOR] ✓ Proyecto ID de route params:', this.proyectoId);
        this.cargarTodosLosDatos();
        return;
      }
    });

    setTimeout(() => {
      if (!this.proyectoId) {
        const idDelStorage = sessionStorage.getItem('proyectoActualId');
        console.log('📌 [SRS-GENERATOR] sessionStorage.proyectoActualId:', idDelStorage);
        
        if (idDelStorage) {
          this.proyectoId = parseInt(idDelStorage, 10);
          console.log('✓ [SRS-GENERATOR] ✓ Proyecto ID de sessionStorage:', this.proyectoId);
          this.cargarTodosLosDatos();
          return;
        }
      }

      if (!this.proyectoId) {
        console.error('❌ [SRS-GENERATOR] ❌ NO SE ENCONTRÓ ID DEL PROYECTO');
        alert('❌ Error: No se encontró el ID del proyecto. Por favor, selecciona un proyecto primero.');
      }
    }, 500);
  }

  /**
   * Carga TODOS los datos: proyecto, stakeholders, usuarios, RF, RNF, etc
   */
  private cargarTodosLosDatos(): void {
    if (!this.proyectoId) {
      console.error('❌ [SRS-GENERATOR] No hay proyectoId para cargar');
      return;
    }

    this.isLoadingProject = true;

    // Cargar proyecto base
    this.cargarProyecto();
    
    // Cargar stakeholders
    this.cargarStakeholders();
    
    // Cargar usuarios del sistema
    this.cargarUsuarios();
    
    // Cargar requerimientos funcionales
    this.cargarRequerimientosFuncionales();
    
    // Cargar requerimientos no funcionales ← DESDE /rnf/
    this.cargarRequerimientosNoFuncionales();
    
    // Cargar casos de uso
    this.cargarCasosDeUso();
    
    // Cargar restricciones/observaciones
    this.cargarRestricciones();

    // Marcar como completado después de 2 segundos
    setTimeout(() => {
      this.isLoadingProject = false;
      console.log('✓ [SRS-GENERATOR] ✓ Carga de todos los datos completada');
    }, 2000);
  }

  /**
   * Carga los datos del proyecto
   */
  private cargarProyecto(): void {
    if (!this.proyectoId) return;

    const apiUrl = `http://localhost:8000/proyectos/${this.proyectoId}`;
    console.log('📥 [SRS-GENERATOR] Cargando proyecto desde:', apiUrl);

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        console.log('✓ [SRS-GENERATOR] ✓ Proyecto cargado');
        
        let proyecto = response?.data || response;
        
        this.proyectoNombre = proyecto.nombre || '';
        this.proyectoCodigo = proyecto.codigo || '';
        this.srsData.projectName = `${this.proyectoNombre} - SRS v1.0`;
        
        if (proyecto.descripcion_problema) {
          this.srsData.introduction = proyecto.descripcion_problema;
        } else if (proyecto.objetivo_general) {
          this.srsData.introduction = proyecto.objetivo_general;
        }
      },
      (error) => {
        console.error('❌ [SRS-GENERATOR] Error al cargar proyecto:', error);
      }
    );
  }

  /**
   * Carga stakeholders del proyecto
   */
  private cargarStakeholders(): void {
    if (!this.proyectoId) return;

    const apiUrl = `http://localhost:8000/stakeholders/?proyecto_id=${this.proyectoId}`;
    console.log('📥 [SRS-GENERATOR] Cargando stakeholders desde:', apiUrl);

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        console.log('✓ [SRS-GENERATOR] ✓ Stakeholders cargados:', response);
        
        const stakeholders = Array.isArray(response) ? response : response?.data || [];
        
        this.srsData.stakeholders = stakeholders.map((s: any) => ({
          name: s.nombre || s.name || '',
          role: s.rol || s.role || '',
          responsibility: s.responsabilidad || s.responsibility || ''
        }));

        console.log('✓ [SRS-GENERATOR] Stakeholders mapeados:', this.srsData.stakeholders);
      },
      (error) => {
        console.error('⚠️ [SRS-GENERATOR] Error al cargar stakeholders:', error);
        console.error('  URL intentada:', apiUrl);
      }
    );
  }

  /**
   * Carga usuarios del sistema
   */
  private cargarUsuarios(): void {
    if (!this.proyectoId) return;

    const apiUrl = `http://localhost:8000/tipo-usuario/?proyecto_id=${this.proyectoId}`;
    console.log('📥 [SRS-GENERATOR] Cargando usuarios desde:', apiUrl);

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        console.log('✓ [SRS-GENERATOR] ✓ Usuarios cargados:', response);
        
        const usuarios = Array.isArray(response) ? response : response?.data || [];
        
        this.srsData.users = usuarios.map((u: any) => ({
          userId: u.id_tipo_usuario || u.userId || u.id || '',
          userType: u.tipo || u.userType || '',
          description: u.descripcion || u.description || ''
        }));

        console.log('✓ [SRS-GENERATOR] Usuarios mapeados:', this.srsData.users);
      },
      (error) => {
        console.error('⚠️ [SRS-GENERATOR] Error al cargar usuarios:', error);
        console.error('  URL intentada:', apiUrl);
      }
    );
  }

  /**
   * Carga requerimientos funcionales
   */
  private cargarRequerimientosFuncionales(): void {
    if (!this.proyectoId) return;

    const apiUrl = `http://localhost:8000/api/requerimientos-funcionales/?proyecto_id=${this.proyectoId}`;
    console.log('📥 [SRS-GENERATOR] Cargando RF desde:', apiUrl);

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        console.log('✓ [SRS-GENERATOR] ✓ RF cargados:', response);
        
        const rf = Array.isArray(response) ? response : response?.data || [];
        
        this.srsData.functionalRequirements = rf.map((r: any) => ({
          rfId: r.rf_id || r.rfId || r.id_req || r.codigo || r.id || '',
          description: r.descripcion || r.description || r.nombre || '',
          priority: r.prioridad || r.priority || 'Media'
        }));

        console.log('✓ [SRS-GENERATOR] RF mapeados:', this.srsData.functionalRequirements);
      },
      (error) => {
        console.error('⚠️ [SRS-GENERATOR] Error al cargar RF:', error);
        console.error('  URL intentada:', apiUrl);
        console.error('  Status:', error.status);
      }
    );
  }

  /**
   * Carga requerimientos no funcionales DESDE /rnf/
   * ✅ CORREGIDO para usar el endpoint correcto
   */
  private cargarRequerimientosNoFuncionales(): void {
    if (!this.proyectoId) return;

    const apiUrl = `http://localhost:8000/rnf/?proyecto_id=${this.proyectoId}`;
    console.log('📥 [SRS-GENERATOR] Cargando RNF desde:', apiUrl);

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        console.log('✓ [SRS-GENERATOR] ✓ RNF cargados:', response);
        
        const rnf = Array.isArray(response) ? response : response?.data || [];
        
        // Mapear los RNF del backend al formato del SRS
        this.srsData.nonFunctionalRequirements = rnf.map((r: any) => ({
          rnfId: r.codigo || r.rnfId || r.id_rnf || r.id || '',  // El backend devuelve "codigo"
          category: r.tipo || r.category || r.categoria || '',    // El backend devuelve "tipo"
          description: r.descripcion || r.description || r.nombre || ''
        }));

        console.log('✓ [SRS-GENERATOR] RNF mapeados:', this.srsData.nonFunctionalRequirements);
        
        // Log detallado para debugging
        if (this.srsData.nonFunctionalRequirements.length > 0) {
          console.log('📊 [SRS-GENERATOR] Primer RNF mapeado:');
          console.log('  - ID:', this.srsData.nonFunctionalRequirements[0].rnfId);
          console.log('  - Categoría:', this.srsData.nonFunctionalRequirements[0].category);
          console.log('  - Descripción:', this.srsData.nonFunctionalRequirements[0].description);
        }
      },
      (error) => {
        console.error('⚠️ [SRS-GENERATOR] Error al cargar RNF:', error);
        console.error('  URL intentada:', apiUrl);
        console.error('  Status:', error.status);
        // No es crítico, continúa sin RNF
      }
    );
  }

  /**
   * Carga casos de uso
   */
  private cargarCasosDeUso(): void {
    if (!this.proyectoId) return;

    const apiUrl = `http://localhost:8000/api/casos-uso/?proyecto_id=${this.proyectoId}`;
    console.log('📥 [SRS-GENERATOR] Cargando casos de uso desde:', apiUrl);

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        console.log('✓ [SRS-GENERATOR] ✓ Casos de uso cargados:', response);
        
        const casosDeUso = Array.isArray(response) ? response : response?.data || [];
        
        this.srsData.useCases = casosDeUso.map((c: any) => ({
          useCase: c.nombre || c.useCase || '',
          actors: c.actores ? (Array.isArray(c.actores) ? c.actores : [c.actores]) : [],
          description: c.descripcion || c.description || '',
          steps: c.pasos ? (Array.isArray(c.pasos) ? c.pasos : [c.pasos]) : []
        }));

        console.log('✓ [SRS-GENERATOR] Casos de uso mapeados:', this.srsData.useCases);
      },
      (error) => {
        console.error('⚠️ [SRS-GENERATOR] Error al cargar casos de uso:', error);
        console.error('  URL intentada:', apiUrl);
      }
    );
  }

  /**
   * Carga restricciones/observaciones
   */
  private cargarRestricciones(): void {
    if (!this.proyectoId) return;

    const apiUrl = `http://localhost:8000/api/observaciones/?proyecto_id=${this.proyectoId}`;
    console.log('📥 [SRS-GENERATOR] Cargando restricciones desde:', apiUrl);

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        console.log('✓ [SRS-GENERATOR] ✓ Restricciones cargadas:', response);
        
        const restricciones = Array.isArray(response) ? response : response?.data || [];
        
        this.srsData.constraints = restricciones.map((r: any) => ({
          constraintId: r.id_observacion || r.constraintId || r.id || '',
          type: r.tipo || r.type || 'Restricción',
          description: r.descripcion || r.description || ''
        }));

        console.log('✓ [SRS-GENERATOR] Restricciones mapeadas:', this.srsData.constraints);
      },
      (error) => {
        console.error('⚠️ [SRS-GENERATOR] Error al cargar restricciones:', error);
        console.error('  URL intentada:', apiUrl);
      }
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ════════════════════════════════════════════════════════════════════════════

  addStakeholder(): void {
    this.srsData.stakeholders.push({
      name: '',
      role: '',
      responsibility: ''
    });
  }

  removeStakeholder(index: number): void {
    this.srsData.stakeholders.splice(index, 1);
  }

  addUser(): void {
    this.srsData.users.push({
      userId: '',
      userType: '',
      description: ''
    });
  }

  removeUser(index: number): void {
    this.srsData.users.splice(index, 1);
  }

  addFunctionalRequirement(): void {
    this.srsData.functionalRequirements.push({
      rfId: '',
      description: '',
      priority: 'Media'
    });
  }

  removeFunctionalRequirement(index: number): void {
    this.srsData.functionalRequirements.splice(index, 1);
  }

  addNonFunctionalRequirement(): void {
    this.srsData.nonFunctionalRequirements.push({
      rnfId: '',
      category: '',
      description: ''
    });
  }

  removeNonFunctionalRequirement(index: number): void {
    this.srsData.nonFunctionalRequirements.splice(index, 1);
  }

  addUseCase(): void {
    this.srsData.useCases.push({
      useCase: '',
      actors: [],
      description: '',
      steps: []
    });
  }

  removeUseCase(index: number): void {
    this.srsData.useCases.splice(index, 1);
  }

  addStep(useCaseIndex: number): void {
    this.srsData.useCases[useCaseIndex].steps.push('');
  }

  removeStep(useCaseIndex: number, stepIndex: number): void {
    this.srsData.useCases[useCaseIndex].steps.splice(stepIndex, 1);
  }

  updateActors(useCaseIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.srsData.useCases[useCaseIndex].actors = input.value
      .split(',')
      .map((actor: string) => actor.trim())
      .filter((actor: string) => actor.length > 0);
  }

  addConstraint(): void {
    this.srsData.constraints.push({
      constraintId: '',
      type: '',
      description: ''
    });
  }

  removeConstraint(index: number): void {
    this.srsData.constraints.splice(index, 1);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE PDF
  // ════════════════════════════════════════════════════════════════════════════

  async generatePDF(): Promise<void> {
    if (!this.proyectoId) {
      alert('❌ No hay proyecto seleccionado.');
      return;
    }

    if (!this.srsData.projectName.trim()) {
      alert('❌ Por favor, ingresa el nombre del proyecto');
      return;
    }

    const tieneContenido = this.srsData.introduction ||
      this.srsData.stakeholders.length > 0 ||
      this.srsData.users.length > 0 ||
      this.srsData.functionalRequirements.length > 0 ||
      this.srsData.nonFunctionalRequirements.length > 0 ||
      this.srsData.useCases.length > 0 ||
      this.srsData.constraints.length > 0;

    if (!tieneContenido) {
      alert('⚠️ Por favor, agrega al menos algo de contenido');
      return;
    }

    this.isLoading = true;
    try {
      console.log('🔄 Generando SRS para proyecto ID:', this.proyectoId);
      await this.srsService.generateSRSPdf(this.srsData, this.proyectoId);
    } finally {
      this.isLoading = false;
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}