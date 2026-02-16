import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verificar si el usuario está autenticado
    const isAuthenticated = localStorage.getItem('srs_authenticated') === 'true';

    if (isAuthenticated) {
      return true;
    }

    // Si no está autenticado, redirigir a bienvenida
    this.router.navigate(['/bienvenida']);
    return false;
  }
}