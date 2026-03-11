// src/app/shared/components/sidebar/sidebar.component.ts

import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnChanges, SimpleChanges } from '@angular/core';
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
export class SidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Output() closeSidebar = new EventEmitter<void>();
  @Input() sidebarOpen = false;

  private destroy$ = new Subject<void>();

  proyectoActivo: ProyectoResumen | null = null;
  mostrarConfirmSalir = false;
  isOpen = false;

  menuItems: MenuItem[] = [
    { label: 'Proyecto',       icon: 'proyecto',       route: '/proyecto'       },
    { label: 'Stakeholders',   icon: 'stakeholders',   route: '/stakeholders'   },
    { label: 'Elicitación',    icon: 'elicitacion',    route: '/elicitacion'    },
    { label: 'Requerimientos', icon: 'requerimientos', route: '/requerimientos' },
    { label: 'RNF',            icon: 'rnf',            route: '/rnf'            },
    { label: 'Negociación',    icon: 'negociacion',    route: '/negociacion'    },
    { label: 'SRS',            icon: 'srs',            route: '/srs'            },
    { label: 'Validación',     icon: 'validacion',     route: '/validacion'     },
    { label: 'Historial',      icon: 'historial',      route: '/historial'      },
  ];

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sidebarOpen']) {
      this.isOpen = this.sidebarOpen;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle del sidebar (hamburguesa)
   */
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el sidebar cuando se hace clic en el overlay
   */
  closeSidebarOnOverlay(): void {
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el sidebar cuando se hace clic en un item del menú
   */
  onMenuItemClick(): void {
    this.isOpen = false;
    this.cdr.markForCheck();
    this.closeSidebar.emit();
  }

  /**
   * Cierra el sidebar cuando se presiona ESC
   */
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
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
    this.isOpen = false;
    this.proyectoSvc.limpiar();
    this.router.navigate(['/proyectos']);
    this.cdr.markForCheck();
  }

  /**
   * Obtiene el icono SVG sanitizado
   * @param iconName Nombre del icono a obtener
   * @returns SafeHtml que contiene el SVG
   */
  getIcon(iconName: string): SafeHtml {
    if (this.iconCache.has(iconName)) {
      return this.iconCache.get(iconName)!;
    }

    const svgString = this.getSvgString(iconName);
    const sanitizedSvg = this.sanitizer.bypassSecurityTrustHtml(svgString);
    
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
      proyecto: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>`,
      
      stakeholders: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
      
      elicitacion: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`,
      
      requerimientos: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>`,
      
      rnf: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>`,
      
      negociacion: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M17 5c0-1.657-1.343-3-3-3s-3 1.343-3 3"/>
        <path d="M9.5 10H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2.5"/>
        <line x1="6" y1="14" x2="18" y2="14"/>
      </svg>`,
      
      srs: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="13" x2="12" y2="17"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>`,
      
      validacion: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
      
      historial: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>`,
    };

    return icons[iconName] || '';
  }
}