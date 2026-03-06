import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, AuthResponse } from '../../core/services/auth.service';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.css']
})
export class BienvenidaComponent implements OnDestroy, OnInit {

  showLoginModal    = false;
  showRegisterModal = false;
  isLoading         = false;

  loginData    = { username: '', password: '' };
  registerData = { username: '', email: '', password: '', confirmPassword: '' };

  loginError      = '';
  registerError   = '';
  registerSuccess = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/proyecto']);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openLoginModal()    { this.showLoginModal = true;    this.showRegisterModal = false; this.resetLoginForm(); }
  openRegisterModal() { this.showRegisterModal = true; this.showLoginModal = false;    this.resetRegisterForm(); }

  closeModals() {
    this.showLoginModal    = false;
    this.showRegisterModal = false;
    this.loginError        = '';
    this.registerError     = '';
    this.registerSuccess   = false;
    this.isLoading         = false;
  }

  switchToRegister() { this.showLoginModal = false;    this.showRegisterModal = true; this.resetRegisterForm(); }
  switchToLogin()    { this.showRegisterModal = false; this.showLoginModal = true;    this.resetLoginForm(); }

  // ── LOGIN ──────────────────────────────────────────────────────────────────

  onLogin() {
    this.loginError = '';
    if (!this.loginData.username || !this.loginData.password) {
      this.loginError = 'Por favor, completa todos los campos';
      return;
    }

    this.isLoading = true;

    this.http.post<AuthResponse>(`http://localhost:8000/api/auth/login`, {
      username: this.loginData.username,
      password: this.loginData.password
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.isLoading = false;

        // ══════════════════════════════════════════
        // DIAGNÓSTICO — borrar después de resolver
        // ══════════════════════════════════════════
        console.log('=== DIAGNÓSTICO LOGIN ===');
        console.log('1. response completo:', JSON.stringify(response));
        console.log('2. response.tokens:', response?.tokens);
        console.log('3. access_token:', response?.tokens?.access_token);
        console.log('4. user:', response?.user);
        try {
          localStorage.setItem('PRUEBA_STORAGE', '123');
          const val = localStorage.getItem('PRUEBA_STORAGE');
          console.log('5. localStorage funciona:', val);
          localStorage.removeItem('PRUEBA_STORAGE');
        } catch(e) {
          console.error('5. localStorage BLOQUEADO:', e);
        }
        console.log('=== FIN DIAGNÓSTICO ===');
        // ══════════════════════════════════════════

        this.authService.saveSession(response);
        this.closeModals();
        this.router.navigate(['/proyecto']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('ERROR EN LOGIN:', error);
        if (error.status === 401) {
          this.loginError = 'Usuario o contraseña incorrectos';
        } else if (error.status === 400) {
          this.loginError = error.error?.detail || 'Error en los datos proporcionados';
        } else {
          this.loginError = 'Error al iniciar sesión. Intenta de nuevo más tarde.';
        }
      }
    });
  }

  // ── REGISTER ───────────────────────────────────────────────────────────────

  onRegister() {
    this.registerError   = '';
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

    this.http.post<AuthResponse>(`http://localhost:8000/api/auth/register`, {
      username: this.registerData.username,
      email:    this.registerData.email,
      password: this.registerData.password
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.isLoading       = false;
        this.registerSuccess = true;

        this.authService.saveSession(response);

        setTimeout(() => {
          this.closeModals();
          this.router.navigate(['/proyecto']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 400) {
          const detail = error.error?.detail || '';
          if (detail.includes('email'))         this.registerError = 'Este correo ya está registrado.';
          else if (detail.includes('username')) this.registerError = 'Este nombre de usuario ya está en uso.';
          else                                  this.registerError = detail || 'Error al registrarse.';
        } else {
          this.registerError = 'Error al registrarse. Intenta de nuevo más tarde.';
        }
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  resetLoginForm() {
    this.loginData  = { username: '', password: '' };
    this.loginError = '';
  }

  resetRegisterForm() {
    this.registerData  = { username: '', email: '', password: '', confirmPassword: '' };
    this.registerError = '';
    this.registerSuccess = false;
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModals();
    }
  }
}