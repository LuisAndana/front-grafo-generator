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
  @Input() usuario: Usuario | null = null;
  @Output() toggleSidebar = new EventEmitter<void>();

  showUserMenu = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('🎨 NavbarComponent constructor - Cargando usuario del localStorage');
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
    if (!this.usuario) {
      this.authService.usuario$
        .pipe(takeUntil(this.destroy$))
        .subscribe(usuario => {
          console.log('📊 Usuario actualizado desde AuthService:', usuario);
          this.usuario = usuario;
        });
    }
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

  toggleMenu(event?: Event) {
    console.log('☰ Hamburguesa clickeada');
    event?.stopPropagation();
    this.toggleSidebar.emit();
    console.log('☰ Evento emitido');
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

  logout() {
    console.log('🚪 Ejecutando logout desde navbar...');
    this.authService.logout();
    this.closeUserMenu();
  }

  handleLogout() {
    console.log('🚪 handleLogout llamado');
    this.logout();
  }

  irABienvenida() {
    console.log('🔄 Navegando a /bienvenida desde botón Login');
    this.router.navigate(['/bienvenida']).then(success => {
      console.log('✅ Navegación a /bienvenida:', success ? 'exitosa' : 'fallida');
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
    });
  }

  getInitials(): string {
    if (!this.usuario) {
      return 'U';
    }

    const nombre = this.usuario.nombre?.charAt(0).toUpperCase() || '';
    const apellido = this.usuario.apellido?.charAt(0).toUpperCase() || '';
    
    return `${nombre}${apellido}` || 'U';
  }

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