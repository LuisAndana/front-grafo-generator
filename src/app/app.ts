import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
        (toggleSidebar)="toggleSidebar()"
        [sidebarOpen]="sidebarOpen">
      </app-navbar>
      <div class="app-body">
        <!-- Sidebar solo si hay usuario -->
        <app-sidebar 
          *ngIf="usuario"
          [isOpen]="sidebarOpen"
          (closeSidebar)="closeSidebar()">
        </app-sidebar>
        
        <!-- Main content -->
        <main class="app-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .app-main {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
      width: 100%;
    }
  `]
})
export class App implements OnInit {
  usuario: any = null;
  sidebarOpen = true;  // ✅ Por defecto abierto en desktop

  constructor(private authService: AuthService) {
    console.log('🎨 App constructor iniciado');
    
    // ✅ LIMPIAR localStorage al iniciar (para eliminar datos viejos)
    console.log('🗑️ Limpiando localStorage antiguo...');
    localStorage.removeItem('srs_token');
    localStorage.removeItem('srs_usuario');
    localStorage.removeItem('srs_authenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    console.log('✅ localStorage limpiado');
    
    // Ahora cargar usuario (que será null)
    this.usuario = null;
    console.log('👤 Usuario inicial:', this.usuario);

    // ✅ DETECTAR TAMAÑO DE PANTALLA AL INICIAR
    this.detectarTamanioPantalla();
  }

  ngOnInit() {
    console.log('🎨 App ngOnInit');
    
    // Suscribirse a cambios del usuario
    this.authService.usuario$.subscribe(usuario => {
      console.log('📊 Usuario actualizado en App desde AuthService:', usuario);
      this.usuario = usuario;
      
      if (usuario) {
        console.log('✅ Usuario logueado:', usuario.nombre);
        console.log('👤 Mostrando sidebar');
      } else {
        console.log('❌ Usuario deslogueado');
        console.log('👤 Ocultando sidebar');
      }
    });

    // ✅ ESCUCHAR CAMBIOS DE TAMAÑO DE PANTALLA
    window.addEventListener('resize', () => this.detectarTamanioPantalla());
  }

  // ✅ MÉTODO PARA DETECTAR TAMAÑO DE PANTALLA
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
    console.log('☰ Cerrando sidebar');
    this.sidebarOpen = false;
  }
}