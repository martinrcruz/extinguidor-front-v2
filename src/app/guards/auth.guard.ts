// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap, filter, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Primero esperamos a que el storage esté inicializado
    return this.authService.storageReady$.pipe(
      filter(ready => ready === true),
      take(1),
      switchMap(() => {
        // Luego verificamos si el usuario está autenticado
        return this.authService.isLoggedIn().pipe(
          map((loggedIn: boolean) => {
            if (!loggedIn) {
              console.log('AuthGuard: Usuario no autenticado, redirigiendo a login');
              this.router.navigate(['/auth/login']);
              return false;
            }
            console.log('AuthGuard: Usuario autenticado');
            return true;
          })
        );
      })
    );
  }
}
