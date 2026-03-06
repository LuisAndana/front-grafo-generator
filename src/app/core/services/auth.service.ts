import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: TokenResponse;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private userSubject: BehaviorSubject<UserResponse | null>;
  public user$: Observable<UserResponse | null>;

  private readonly apiUrl      = environment.apiUrl || 'http://localhost:8000';
  private readonly TOKEN_KEY   = 'srs_token';
  private readonly REFRESH_KEY = 'srs_refresh_token';
  private readonly USER_KEY    = 'srs_usuario';
  private readonly AUTH_KEY    = 'srs_authenticated';

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.userSubject = new BehaviorSubject<UserResponse | null>(
      this.getUserFromStorage()
    );
    this.user$ = this.userSubject.asObservable();
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  public get usuarioActual(): UserResponse | null {
    return this.userSubject.value;
  }

  public get token(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public isAuthenticated(): boolean {
    try {
      return localStorage.getItem(this.AUTH_KEY) === 'true' && !!this.token;
    } catch {
      return false;
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, {
      username,
      password
    }).pipe(
      tap(response => this.saveSession(response)),
      catchError(this.handleError)
    );
  }

  // ── Register ───────────────────────────────────────────────────────────────

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/register`, {
      username,
      email,
      password
    }).pipe(
      tap(response => this.saveSession(response)),
      catchError(this.handleError)
    );
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  logout(): void {
    this.clearSession();
    this.userSubject.next(null);
    this.router.navigate(['/bienvenida']);
  }

  // ── saveSession — SIN isPlatformBrowser, angular.json no tiene SSR ─────────

  saveSession(response: AuthResponse): void {
    this.userSubject.next(response.user);
    try {
      localStorage.setItem(this.TOKEN_KEY,   response.tokens.access_token);
      localStorage.setItem(this.REFRESH_KEY, response.tokens.refresh_token);
      localStorage.setItem(this.USER_KEY,    JSON.stringify(response.user));
      localStorage.setItem(this.AUTH_KEY,    'true');
    } catch (e) {
      console.error('No se pudo guardar sesión en localStorage:', e);
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.AUTH_KEY);
    } catch { /* ignorar */ }
  }

  private getUserFromStorage(): UserResponse | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private handleError(error: HttpErrorResponse) {
    let msg = 'Error en el servidor';
    if (error.error instanceof ErrorEvent) {
      msg = error.error.message;
    } else {
      switch (error.status) {
        case 401: msg = 'Credenciales inválidas'; break;
        case 400: msg = error.error?.detail || 'Datos inválidos'; break;
        case 409: msg = 'El usuario ya existe'; break;
        case 500: msg = 'Error interno del servidor'; break;
        default:  msg = error.error?.detail || msg;
      }
    }
    return throwError(() => ({ message: msg, status: error.status }));
  }
}