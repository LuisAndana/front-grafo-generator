// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProyectoActivoService, ProyectoResumen } from '../../../core/services/proyecto-activo.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = true;
  @Output() closeSidebar = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  proyectoActivo: ProyectoResumen | null = null;
  mostrarConfirmSalir = false;

  menuItems: MenuItem[] = [
    { label: 'Proyecto',       icon: 'proyecto',       route: '/proyecto'       },
    { label: 'Stakeholders',   icon: 'stakeholders',   route: '/stakeholders'   },
    { label: 'Elicitación',    icon: 'elicitacion',    route: '/elicitacion'    },
    { label: 'Requerimientos', icon: 'requerimientos', route: '/requerimientos' },
    { label: 'Negociación',    icon: 'negociacion',    route: '/negociacion'    },
    { label: 'SRS',            icon: 'srs',            route: '/srs'            },
    { label: 'Validación',     icon: 'validacion',     route: '/validacion'     },
    { label: 'Historial',      icon: 'historial',      route: '/historial'      },
  ];

  // Cache para SVGs sanitizados
  private iconCache: Map<string, SafeHtml> = new Map();

  constructor(
    private proyectoSvc: ProyectoActivoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.proyectoSvc.proyecto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => {
        this.proyectoActivo = p;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMenuItemClick(): void {
    this.closeSidebar.emit();
  }

  pedirSalir(): void {
    this.mostrarConfirmSalir = true;
    this.cdr.markForCheck();
  }

  cancelarSalir(): void {
    this.mostrarConfirmSalir = false;
    this.cdr.markForCheck();
  }

  confirmarSalir(): void {
    this.mostrarConfirmSalir = false;
    this.proyectoSvc.limpiar();
    this.router.navigate(['/proyectos']);
    this.cdr.markForCheck();
  }

  /**
   * Obtiene el icono SVG sanitizado para evitar problemas de seguridad
   * @param iconName Nombre del icono a obtener
   * @returns SafeHtml que contiene el SVG
   */
  getIcon(iconName: string): SafeHtml {
    // Buscar en cache
    if (this.iconCache.has(iconName)) {
      return this.iconCache.get(iconName)!;
    }

    const svgString = this.getSvgString(iconName);
    const sanitizedSvg = this.sanitizer.bypassSecurityTrustHtml(svgString);
    
    // Guardar en cache
    this.iconCache.set(iconName, sanitizedSvg);
    
    return sanitizedSvg;
  }

  /**
   * Retorna el string SVG según el nombre del icono
   * @param iconName Nombre del icono
   * @returns String SVG
   */
  private getSvgString(iconName: string): string {
    const icons: { [key: string]: string } = {
      // PROYECTO - Carpeta de proyecto
      proyecto: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>`,
      
      // STAKEHOLDERS - Múltiples personas
      stakeholders: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
      
      // ELICITACIÓN - Chat/Conversación
      elicitacion: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`,
      
      // REQUERIMIENTOS - Gráfico de barras
      requerimientos: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>`,
      
      // NEGOCIACIÓN - Handshake/Acuerdo
      negociacion: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M17 5c0-1.657-1.343-3-3-3s-3 1.343-3 3"/>
        <path d="M9.5 10H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2.5"/>
        <line x1="6" y1="14" x2="18" y2="14"/>
      </svg>`,
      
      // SRS - Documento/Especificación
      srs: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="13" x2="12" y2="17"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>`,
      
      // VALIDACIÓN - Checkmark/Aprobación
      validacion: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
      
      // HISTORIAL - Reloj/Historial
      historial: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>`,
    };

    return icons[iconName] || '';
  }
}