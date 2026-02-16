import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.css']
})
export class BienvenidaComponent {
  // Control de modales
  showLoginModal = false;
  showRegisterModal = false;

  // Datos de login
  loginData = {
    email: '',
    password: ''
  };

  // Datos de registro
  registerData = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  // Mensajes
  loginError = '';
  registerError = '';
  registerSuccess = false;

  constructor(private router: Router) {}

  /**
   * Abrir modal de login
   */
  openLoginModal() {
    this.showLoginModal = true;
    this.showRegisterModal = false;
    this.resetLoginForm();
  }

  /**
   * Abrir modal de registro
   */
  openRegisterModal() {
    this.showRegisterModal = true;
    this.showLoginModal = false;
    this.resetRegisterForm();
  }

  /**
   * Cerrar modales
   */
  closeModals() {
    this.showLoginModal = false;
    this.showRegisterModal = false;
    this.loginError = '';
    this.registerError = '';
    this.registerSuccess = false;
  }

  /**
   * Cambiar entre modales
   */
  switchToRegister() {
    this.showLoginModal = false;
    this.showRegisterModal = true;
    this.resetRegisterForm();
  }

  switchToLogin() {
    this.showRegisterModal = false;
    this.showLoginModal = true;
    this.resetLoginForm();
  }

  /**
   * Procesar login (sin backend por ahora)
   */
  onLogin() {
    this.loginError = '';

    // Validación básica
    if (!this.loginData.email || !this.loginData.password) {
      this.loginError = 'Por favor, completa todos los campos';
      return;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.loginError = 'Por favor, ingresa un email válido';
      return;
    }

    // Simulación de login exitoso
    // Guardar datos de usuario en localStorage
    const usuario = {
      email: this.loginData.email,
      nombre: 'Usuario',
      apellido: 'Demo',
      fechaLogin: new Date()
    };

    localStorage.setItem('srs_usuario', JSON.stringify(usuario));
    localStorage.setItem('srs_authenticated', 'true');

    // Redirigir a la página principal
    this.closeModals();
    this.router.navigate(['/proyecto']);
  }

  /**
   * Procesar registro (sin backend por ahora)
   */
  onRegister() {
    this.registerError = '';
    this.registerSuccess = false;

    // Validación básica
    if (!this.registerData.nombre || !this.registerData.apellido || 
        !this.registerData.email || !this.registerData.password || 
        !this.registerData.confirmPassword) {
      this.registerError = 'Por favor, completa todos los campos';
      return;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.registerError = 'Por favor, ingresa un email válido';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.registerError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.registerError = 'Las contraseñas no coinciden';
      return;
    }

    // Simulación de registro exitoso
    this.registerSuccess = true;

    setTimeout(() => {
      // Guardar datos de usuario en localStorage
      const usuario = {
        email: this.registerData.email,
        nombre: this.registerData.nombre,
        apellido: this.registerData.apellido,
        fechaRegistro: new Date()
      };

      localStorage.setItem('srs_usuario', JSON.stringify(usuario));
      localStorage.setItem('srs_authenticated', 'true');

      // Redirigir a la página principal
      this.closeModals();
      this.router.navigate(['/proyecto']);
    }, 1500);
  }

  /**
   * Validar email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Resetear formulario de login
   */
  resetLoginForm() {
    this.loginData = {
      email: '',
      password: ''
    };
    this.loginError = '';
  }

  /**
   * Resetear formulario de registro
   */
  resetRegisterForm() {
    this.registerData = {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    this.registerError = '';
    this.registerSuccess = false;
  }

  /**
   * Cerrar modal al hacer clic fuera
   */
  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModals();
    }
  }
}