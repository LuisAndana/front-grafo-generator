// src/app/shared/components/navbar/navbar.component.ts

import { Component, Output, EventEmitter, Input, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserResponse } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Input() sidebarOpen = false;
  @Input() usuario: UserResponse | null = null;

  showDropdown = false;
  showLogoutConfirm = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Toggle del menú hamburguesa en navbar (mobile)
   */
  toggleMenuMobile(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Toggle del menú hamburguesa
   */
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.sidebarOpen = !this.sidebarOpen;
    this.toggleSidebar.emit();
  }

  /**
   * Toggle del dropdown de usuario
   */
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Cierra el dropdown cuando se hace clic fuera
   */
  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {
    if (this.showDropdown) {
      this.showDropdown = false;
    }
  }

  /**
   * Obtiene las iniciales del nombre del usuario
   * @param nombre Nombre completo del usuario
   * @returns Iniciales en mayúscula
   */
  getInitials(nombre: string): string {
    if (!nombre) return '?';
    
    const palabras = nombre.trim().split(' ');
    let iniciales = '';
    
    for (let i = 0; i < Math.min(2, palabras.length); i++) {
      if (palabras[i].length > 0) {
        iniciales += palabras[i].charAt(0).toUpperCase();
      }
    }
    
    return iniciales || '?';
  }

  /**
   * Pide confirmación para logout
   */
  pedirLogout(): void {
    this.showDropdown = false;
    this.showLogoutConfirm = true;
  }

  /**
   * Cancela el logout
   */
  cancelarLogout(): void {
    this.showLogoutConfirm = false;
  }

  /**
   * Confirma y ejecuta el logout
   */
  confirmarLogout(): void {
    this.showLogoutConfirm = false;
    this.authService.logout();
    this.router.navigate(['/bienvenida']);
  }
}