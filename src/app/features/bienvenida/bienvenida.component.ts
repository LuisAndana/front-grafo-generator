import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.css']
})
export class BienvenidaComponent {
  showLoginModal = false;
  showRegisterModal = false;
  isLoading = false;

  loginData = {
    email: '',
    password: ''
  };

  registerData = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  loginError = '';
  registerError = '';
  registerSuccess = false;

  private apiUrl = 'http://localhost:8000';

  constructor(private router: Router, private http: HttpClient) {}

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

    if (!this.loginData.email || !this.loginData.password) {
      this.loginError = 'Por favor, completa todos los campos';
      return;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.loginError = 'Por favor, ingresa un email válido';
      return;
    }

    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/login`, {
      email: this.loginData.email,
      password: this.loginData.password
    }).subscribe(
      response => {
        this.isLoading = false;
        localStorage.setItem('srs_token', response.token);
        localStorage.setItem('srs_usuario', JSON.stringify(response.usuario));
        localStorage.setItem('srs_authenticated', 'true');

        this.closeModals();
        this.router.navigate(['/proyecto']);
      },
      error => {
        this.isLoading = false;
        this.loginError = error.error.detail || 'Error en el login';
      }
    );
  }

  onRegister() {
    this.registerError = '';
    this.registerSuccess = false;

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

    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/registro`, {
      nombre: this.registerData.nombre,
      apellido: this.registerData.apellido,
      email: this.registerData.email,
      password: this.registerData.password
    }).subscribe(
      response => {
        this.isLoading = false;
        this.registerSuccess = true;

        setTimeout(() => {
          localStorage.setItem('srs_token', response.token);
          localStorage.setItem('srs_usuario', JSON.stringify(response.usuario));
          localStorage.setItem('srs_authenticated', 'true');

          this.closeModals();
          this.router.navigate(['/proyecto']);
        }, 1500);
      },
      error => {
        this.isLoading = false;
        this.registerError = error.error.detail || 'Error en el registro';
      }
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  resetLoginForm() {
    this.loginData = { email: '', password: '' };
    this.loginError = '';
  }

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

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModals();
    }
  }
}