import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

  showLoginModal = false;
  showRegisterModal = false;
  isLoading = false;

  loginData = { username: '', password: '' };
  registerData = { username: '', email: '', password: '', confirmPassword: '' };

  loginError = '';
  registerError = '';
  registerSuccess = false;

  private destroy$ = new Subject<void>();
  private apiUrl = 'http://localhost:8000';

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object  // ← clave para detectar SSR
  ) {}

  ngOnInit() {
    // Solo acceder a localStorage en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('srs_token');
      const usuario = localStorage.getItem('srs_usuario');
      if (token && usuario) {
        this.router.navigate(['/proyecto']);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openLoginModal() {
    this.showLoginModal = true;
    this.showRegisterModal = false;
    this.resetLoginForm();
  }

  openRegisterModal() {
    this.showRegisterModal = true;
    this.showLoginModal = false;
    this.resetRegisterForm();
  }

  closeModals() {
    this.showLoginModal = false;
    this.showRegisterModal = false;
    this.loginError = '';
    this.registerError = '';
    this.registerSuccess = false;
    this.isLoading = false;
  }

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

  onLogin() {
    this.loginError = '';

    if (!this.loginData.username || !this.loginData.password) {
      this.loginError = 'Por favor, completa todos los campos';
      return;
    }

    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/api/auth/login`, {
      username: this.loginData.username,
      password: this.loginData.password
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          // Guardar solo en el navegador
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('srs_token', response.tokens.access_token);
            localStorage.setItem('srs_refresh_token', response.tokens.refresh_token);
            localStorage.setItem('srs_usuario', JSON.stringify(response.user));
            localStorage.setItem('srs_authenticated', 'true');
            console.log('✅ Token guardado:', response.tokens.access_token.substring(0, 30) + '...');
          }

          this.closeModals();
          this.router.navigate(['/proyecto']);
        },
        error: (error) => {
          this.isLoading = false;
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

  onRegister() {
    this.registerError = '';
    this.registerSuccess = false;

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

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('srs_token', response.tokens.access_token);
            localStorage.setItem('srs_refresh_token', response.tokens.refresh_token);
            localStorage.setItem('srs_usuario', JSON.stringify(response.user));
            localStorage.setItem('srs_authenticated', 'true');
          }

          setTimeout(() => {
            this.closeModals();
            this.router.navigate(['/proyecto']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 400) {
            const detail = error.error.detail || '';
            if (detail.includes('email')) {
              this.registerError = 'Este correo ya está registrado.';
            } else if (detail.includes('username')) {
              this.registerError = 'Este nombre de usuario ya está en uso.';
            } else {
              this.registerError = detail || 'Error al registrarse.';
            }
          } else {
            this.registerError = 'Error al registrarse. Intenta de nuevo más tarde.';
          }
          console.error('Error de registro:', error);
        }
      });
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  resetLoginForm() {
    this.loginData = { username: '', password: '' };
    this.loginError = '';
  }

  resetRegisterForm() {
    this.registerData = { username: '', email: '', password: '', confirmPassword: '' };
    this.registerError = '';
    this.registerSuccess = false;
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModals();
    }
  }
}