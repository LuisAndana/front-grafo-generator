import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserResponse } from '../../../core/services/auth.service';
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
  @Input() usuario: UserResponse | null = null;
  @Output() toggleSidebar = new EventEmitter<void>();

  showUserMenu = false;
  showLogoutConfirm = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo acceder a localStorage en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const usuarioStr = localStorage.getItem('srs_usuario');
      if (usuarioStr) {
        try {
          this.usuario = JSON.parse(usuarioStr);
        } catch {
          // silencioso
        }
      }
    }
  }

  ngOnInit() {
    if (!this.usuario) {
      this.authService.user$
        .pipe(takeUntil(this.destroy$))
        .subscribe((usuario: UserResponse | null) => {
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
    if (!target.closest('.user-menu') && this.showUserMenu) {
      this.showUserMenu = false;
    }
  }

  toggleMenu(event?: Event) {
    event?.stopPropagation();
    this.toggleSidebar.emit();
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu() {
    this.showUserMenu = false;
  }

  openLogoutConfirm() {
    this.showLogoutConfirm = true;
  }

  closeLogoutConfirm() {
    this.showLogoutConfirm = false;
  }

  confirmLogout() {
    this.logout();
  }

  logout() {
    this.authService.logout();
    this.closeUserMenu();
    this.closeLogoutConfirm();
  }

  irABienvenida() {
    this.router.navigate(['/bienvenida']);
  }

  getInitials(): string {
    if (!this.usuario) return 'U';
    // El backend devuelve username, no nombre/apellido
    return this.usuario.username?.charAt(0).toUpperCase() || 'U';
  }

  getRolFormatted(): string {
    return 'Analista';
  }

  getNombreUsuario(): string {
    return this.usuario?.username || 'Usuario';
  }
}