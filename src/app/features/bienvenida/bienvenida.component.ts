import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.css']
})
export class BienvenidaComponent implements OnDestroy, OnInit {
  // Control de modales
  showLoginModal = false;
  showRegisterModal = false;
  isLoading = false;

  // Datos de login
  loginData = {
    username: '',
    password: ''
  };

  // Datos de registro
  registerData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  // Mensajes
  loginError = '';
  registerError = '';
  registerSuccess = false;

  // Para limpiar suscripciones
  private destroy$ = new Subject<void>();

  // URL de la API
  private apiUrl = 'http://localhost:8000';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Verificar si ya está autenticado
    const token = localStorage.getItem('access_token');
    if (token) {
      this.router.navigate(['/proyecto']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    this.isLoading = false;
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
   * Procesar login
   */
  onLogin() {
    this.loginError = '';

    // Validación básica
    if (!this.loginData.username || !this.loginData.password) {
      this.loginError = 'Por favor, completa todos los campos';
      return;
    }

    // Llamar al endpoint de login
    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/api/auth/login`, {
      username: this.loginData.username,
      password: this.loginData.password
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Guardar tokens y usuario
          localStorage.setItem('access_token', response.tokens.access_token);
          localStorage.setItem('refresh_token', response.tokens.refresh_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          this.closeModals();
          
          // Redirigir a la página principal
          this.router.navigate(['/proyecto']);
        },
        error: (error) => {
          this.isLoading = false;
          
          // Manejar diferentes tipos de errores
          if (error.status === 401) {
            this.loginError = 'Usuario o contraseña incorrectos';
          } else if (error.status === 400) {
            this.loginError = error.error.detail || 'Error en los datos proporcionados';
          } else {
            this.loginError = 'Error al iniciar sesión. Intenta de nuevo más tarde.';
          }
          
          console.error('Error de login:', error);
        }
      });
  }

  /**
   * Procesar registro
   */
  onRegister() {
    this.registerError = '';
    this.registerSuccess = false;

    // Validación básica
    if (!this.registerData.username || !this.registerData.email || 
        !this.registerData.password || !this.registerData.confirmPassword) {
      this.registerError = 'Por favor, completa todos los campos';
      return;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.registerError = 'Por favor, ingresa un email válido';
      return;
    }

    if (this.registerData.password.length < 8) {
      this.registerError = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.registerError = 'Las contraseñas no coinciden';
      return;
    }

    // Llamar al endpoint de registro
    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/api/auth/register`, {
      username: this.registerData.username,
      email: this.registerData.email,
      password: this.registerData.password
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.registerSuccess = true;

          // Guardar tokens y usuario
          localStorage.setItem('access_token', response.tokens.access_token);
          localStorage.setItem('refresh_token', response.tokens.refresh_token);
          localStorage.setItem('user', JSON.stringify(response.user));

          // Esperar un momento antes de redirigir
          setTimeout(() => {
            this.closeModals();
            this.router.navigate(['/proyecto']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          
          // Manejar diferentes tipos de errores
          if (error.status === 400) {
            // Puede ser email duplicado o username duplicado
            const detail = error.error.detail || '';
            if (detail.includes('email')) {
              this.registerError = 'Este correo ya está registrado. Intenta iniciar sesión.';
            } else if (detail.includes('username')) {
              this.registerError = 'Este nombre de usuario ya está en uso. Elige otro.';
            } else {
              this.registerError = detail || 'Error al registrarse. Intenta de nuevo.';
            }
          } else {
            this.registerError = 'Error al registrarse. Intenta de nuevo más tarde.';
          }
          
          console.error('Error de registro:', error);
        }
      });
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
      username: '',
      password: ''
    };
    this.loginError = '';
  }

  /**
   * Resetear formulario de registro
   */
  resetRegisterForm() {
    this.registerData = {
      username: '',
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