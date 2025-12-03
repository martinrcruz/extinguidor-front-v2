import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, from } from 'rxjs';
import { map, switchMap, filter, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    // Primero esperamos a que el storage esté inicializado
    return this.authService.storageReady$.pipe(
      filter(ready => ready === true),
      take(1),
      switchMap(() => {
        // Verificar si el usuario está autenticado primero
        return this.authService.isLoggedIn().pipe(
          take(1),
          switchMap((isLoggedIn: boolean) => {
            if (!isLoggedIn) {
              console.log('AdminGuard: Usuario no autenticado, redirigiendo a login');
              this.router.navigate(['/auth/login']);
              return from([false]);
            }
            
            // Verificar el rol
            return from(this.authService.getRole()).pipe(
              map((role: string | null) => {
                const normalizedRole = role?.toLowerCase();
                
                if (normalizedRole === 'admin') {
                  console.log('AdminGuard: Usuario es admin');
                  return true;
                }
                
                // Si no es admin, redirigir a login
                console.log('AdminGuard: Usuario no es admin (rol:', normalizedRole, '), redirigiendo a login');
                this.router.navigate(['/auth/login']);
                return false;
              })
            );
          })
        );
      })
    );
  }
}
