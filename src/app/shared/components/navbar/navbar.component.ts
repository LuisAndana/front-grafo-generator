import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, Usuario } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() sidebarOpen = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  usuario: Usuario | null = null;
  showUserMenu = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('🎨 NavbarComponent constructor - Cargando usuario del localStorage');
    // Cargar usuario del localStorage si existe
    const usuarioStr = localStorage.getItem('srs_usuario');
    if (usuarioStr) {
      try {
        this.usuario = JSON.parse(usuarioStr);
        console.log('✅ Usuario cargado del localStorage:', this.usuario);
      } catch {
        console.log('⚠️ No se pudo parsear usuario del localStorage');
      }
    }
  }

  ngOnInit() {
    console.log('🎨 NavbarComponent ngOnInit');
    this.authService.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        console.log('📊 Usuario actualizado desde AuthService:', usuario);
        this.usuario = usuario;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const userMenu = target.closest('.user-menu');
    
    if (!userMenu && this.showUserMenu) {
      this.showUserMenu = false;
    }
  }

  toggleMenu() {
    console.log('☰ Hamburguesa clickeada - sidebarOpen antes:', this.sidebarOpen);
    event?.stopPropagation();
    this.toggleSidebar.emit();
    console.log('☰ Hamburguesa clickeada - evento emitido');
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.showUserMenu = !this.showUserMenu;
    console.log('👤 Toggle user menu - abierto:', this.showUserMenu);
  }

  closeUserMenu() {
    console.log('👤 Cerrando user menu');
    this.showUserMenu = false;
  }

  /**
   * Logout - ejecuta logout del AuthService
   */
  logout() {
    console.log('🚪 Ejecutando logout desde navbar...');
    this.authService.logout();
    this.closeUserMenu();
  }

  /**
   * Handle Logout - wrapper para el botón del dropdown
   */
  handleLogout() {
    console.log('🚪 handleLogout llamado');
    this.logout();
  }

  /**
   * Ir a Bienvenida - para cuando no hay usuario
   */
  irABienvenida() {
    console.log('🔄 Navegando a /bienvenida desde botón Login');
    this.router.navigate(['/bienvenida']).then(success => {
      console.log('✅ Navegación a /bienvenida:', success ? 'exitosa' : 'fallida');
    });
  }

  /**
   * Obtener iniciales del usuario
   */
  getInitials(): string {
    if (!this.usuario) {
      return 'U';
    }

    const nombre = this.usuario.nombre?.charAt(0).toUpperCase() || '';
    const apellido = this.usuario.apellido?.charAt(0).toUpperCase() || '';
    
    return `${nombre}${apellido}` || 'U';
  }

  /**
   * Obtener rol formateado del usuario
   */
  getRolFormatted(): string {
    if (!this.usuario?.rol) {
      return 'Usuario';
    }
    
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'project_manager': 'Jefe de Proyecto',
      'developer': 'Desarrollador',
      'analyst': 'Analista',
      'stakeholder': 'Stakeholder'
    };
    
    return roles[this.usuario.rol] || this.usuario.rol;
  }

  /**
   * Obtener nombre completo del usuario
   */
  getNombreUsuario(): string {
    if (!this.usuario) {
      return 'Usuario';
    }

    if (this.usuario.nombre && this.usuario.apellido) {
      return `${this.usuario.nombre} ${this.usuario.apellido}`;
    }

    return this.usuario.nombre || 'Usuario';
  }
}