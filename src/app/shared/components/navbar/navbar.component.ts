import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, Usuario } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  usuario: Usuario | null = null;
  showUserMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Suscribirse a los cambios del usuario
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });
  }

  /**
   * Toggle del menú de usuario
   */
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  /**
   * Cerrar menú al hacer clic fuera
   */
  closeUserMenu() {
    this.showUserMenu = false;
  }

  /**
   * Logout
   */
  logout() {
    this.authService.logout();
    this.closeUserMenu();
  }

  /**
   * Obtener iniciales del usuario
   */
  getInitials(): string {
    if (this.usuario) {
      const nombre = this.usuario.nombre.charAt(0).toUpperCase();
      const apellido = this.usuario.apellido.charAt(0).toUpperCase();
      return `${nombre}${apellido}`;
    }
    return 'U';
  }
}