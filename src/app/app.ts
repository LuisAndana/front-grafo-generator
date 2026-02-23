import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';

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
          *ngIf="!isWelcomePage && usuario"
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
  usuario: any = null;
  sidebarOpen = true;
  isWelcomePage = false;

  constructor(private authService: AuthService, private router: Router) {
    console.log('🎨 App constructor iniciado');
    
    this.verificarYLimpiarStorageInvalido();
    this.detectarTamanioPantalla();
  }

  ngOnInit() {
    console.log('🎨 App ngOnInit');
    
    // Detectar si estamos en la página de bienvenida
    this.router.events.subscribe(() => {
      this.isWelcomePage = this.router.url === '/bienvenida';
      console.log('📍 Página actual:', this.router.url);
      console.log('📍 ¿Es bienvenida?:', this.isWelcomePage);
    });
    
    this.authService.usuario$.subscribe(usuario => {
      console.log('📊 Usuario actualizado en App desde AuthService:', usuario);
      this.usuario = usuario;
      
      if (usuario) {
        console.log('✅ Usuario logueado:', usuario.nombre);
        console.log('👤 Mostrando navbar y sidebar');
        this.detectarTamanioPantalla();
      } else {
        console.log('❌ Usuario deslogueado');
        console.log('👤 Navbar y sidebar ocultos si estamos en bienvenida');
        this.sidebarOpen = false;
      }
    });

    window.addEventListener('resize', () => this.detectarTamanioPantalla());
  }

  private verificarYLimpiarStorageInvalido() {
    const token = localStorage.getItem('srs_token');
    const usuario = localStorage.getItem('srs_usuario');
    const authenticated = localStorage.getItem('srs_authenticated');

    console.log('🔍 Verificando estado de localStorage...');
    console.log('   - Token:', token ? 'existe' : 'no existe');
    console.log('   - Usuario:', usuario ? 'existe' : 'no existe');
    console.log('   - Authenticated:', authenticated);

    if (token && !usuario) {
      console.log('⚠️ Datos corruptos detectados (token sin usuario) - Limpiando...');
      this.limpiarAuthData();
      return;
    }

    if (authenticated === 'true' && (!token || !usuario)) {
      console.log('⚠️ Estado inconsistente detectado - Limpiando...');
      this.limpiarAuthData();
      return;
    }

    console.log('✅ Estado de localStorage válido');
  }

  private limpiarAuthData() {
    console.log('🗑️ Limpiando datos de autenticación inválidos...');
    localStorage.removeItem('srs_token');
    localStorage.removeItem('srs_usuario');
    localStorage.removeItem('srs_authenticated');
    console.log('✅ Datos limpios');
  }

  detectarTamanioPantalla() {
    const esMovil = window.innerWidth <= 768;
    if (esMovil) {
      this.sidebarOpen = false;
      console.log('📱 Pantalla móvil - Sidebar cerrado por defecto');
    } else {
      this.sidebarOpen = true;
      console.log('🖥️ Pantalla desktop - Sidebar abierto por defecto');
    }
  }

  toggleSidebar() {
    console.log('☰ Toggle sidebar - antes:', this.sidebarOpen);
    this.sidebarOpen = !this.sidebarOpen;
    console.log('☰ Toggle sidebar - después:', this.sidebarOpen);
  }

  closeSidebar() {
    console.log('☰ Cerrando sidebar desde App');
    const esMovil = window.innerWidth <= 768;
    if (esMovil) {
      this.sidebarOpen = false;
    }
  }
}