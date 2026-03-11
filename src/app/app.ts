// src/app/app.ts

import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService, UserResponse } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  usuario: UserResponse | null = null;
  sidebarOpen = true;
  isWelcomePage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.verificarYLimpiarStorageInvalido();
      this.detectarTamanioPantalla();
    }

    this.isWelcomePage = this.router.url === '/bienvenida';
  }

  ngOnInit() {
    // Detectar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isWelcomePage = event.url === '/bienvenida';
        this.cdr.markForCheck();
      });

    // Obtener usuario actual
    this.authService.user$.subscribe((usuario: UserResponse | null) => {
      this.usuario = usuario;
      if (!usuario) {
        this.sidebarOpen = false;
      }
      this.cdr.markForCheck();
    });

    // Listener para cambios de tamaño
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', () => this.detectarTamanioPantalla());
    }
  }

  /**
   * Verifica y limpia datos de autenticación inválidos
   */
  private verificarYLimpiarStorageInvalido() {
    const token = localStorage.getItem('srs_token');
    const usuario = localStorage.getItem('srs_usuario');
    const authenticated = localStorage.getItem('srs_authenticated');

    if ((token && !usuario) || (authenticated === 'true' && (!token || !usuario))) {
      this.limpiarAuthData();
    }
  }

  /**
   * Limpia los datos de autenticación
   */
  private limpiarAuthData() {
    localStorage.removeItem('srs_token');
    localStorage.removeItem('srs_usuario');
    localStorage.removeItem('srs_authenticated');
  }

  /**
   * Detecta el tamaño de pantalla y ajusta el sidebar
   */
  detectarTamanioPantalla() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const isDesktop = window.innerWidth > 1024;
    this.sidebarOpen = isDesktop;  // Desktop: siempre abierto. Mobile: cerrado pero existe
    this.cdr.markForCheck();
  }

  /**
   * Toggle del sidebar
   */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el sidebar (en móvil)
   */
  closeSidebar() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.innerWidth <= 1024) {
      this.sidebarOpen = false;
      this.cdr.markForCheck();
    }
  }
}