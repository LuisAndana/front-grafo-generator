import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional para agregar el token JWT a las peticiones
 */
export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtener el token
  const token = authService.token;

  // Si existe token y no es una petición de auth, agregarlo
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/registro');

  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401 (no autorizado), hacer logout
      if (error.status === 401 && !isAuthEndpoint) {
        authService.logout();
      }
      
      return throwError(() => error);
    })
  );
};