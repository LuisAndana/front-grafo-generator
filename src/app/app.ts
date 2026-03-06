import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
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
  template: `
    <div class="app-layout">
      <app-navbar 
        *ngIf="!isWelcomePage"
        (toggleSidebar)="toggleSidebar()"
        [sidebarOpen]="sidebarOpen"
        [usuario]="usuario">
      </app-navbar>
      
      <div class="app-body">
        <app-sidebar 
          *ngIf="!isWelcomePage"
          [isOpen]="sidebarOpen"
          (closeSidebar)="closeSidebar()">
        </app-sidebar>
        
        <main class="app-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --header-height: 64px;
    }

    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--bg-color, #f5f5f5);
    }

    .app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
      padding-top: 64px;
      gap: 0;
    }

    .app-main {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
      width: 100%;
    }

    @media (max-width: 768px) {
      .app-body {
        position: relative;
      }
    }
  `]
})
export class App implements OnInit {
  usuario: UserResponse | null = null;
  sidebarOpen = true;
  isWelcomePage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
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
      });

    // ← CORREGIDO: usuario$ → user$, tipo explícito
    this.authService.user$.subscribe((usuario: UserResponse | null) => {
      this.usuario = usuario;
      if (!usuario) {
        this.sidebarOpen = false;
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', () => this.detectarTamanioPantalla());
    }
  }

  private verificarYLimpiarStorageInvalido() {
    // Solo se llama cuando isPlatformBrowser ya fue verificado
    const token         = localStorage.getItem('srs_token');
    const usuario       = localStorage.getItem('srs_usuario');
    const authenticated = localStorage.getItem('srs_authenticated');

    if ((token && !usuario) || (authenticated === 'true' && (!token || !usuario))) {
      this.limpiarAuthData();
    }
  }

  private limpiarAuthData() {
    localStorage.removeItem('srs_token');
    localStorage.removeItem('srs_usuario');
    localStorage.removeItem('srs_authenticated');
  }

  detectarTamanioPantalla() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.sidebarOpen = window.innerWidth > 768;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    }
  }
}