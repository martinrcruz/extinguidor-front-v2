// role.guard.ts (extracto)
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, from } from 'rxjs';
import { map, switchMap, filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WorkerGuard implements CanActivate {

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
              console.log('WorkerGuard: Usuario no autenticado, redirigiendo a login');
              this.router.navigate(['/auth/login']);
              return from([false]);
            }
            
            // Verificar el rol
            const user = this.authService.getUser();
            if (user?.role) {
              const role = user.role.toLowerCase();
              if (role === 'worker') {
                console.log('WorkerGuard: Usuario es worker');
                return from([true]);
              }
            }
            
            // Si no hay rol en el usuario, obtenerlo del token
            return from(this.authService.getRole()).pipe(
              map((role: string | null) => {
                const normalizedRole = role?.toLowerCase();
                
                if (normalizedRole === 'worker') {
                  console.log('WorkerGuard: Usuario es worker');
                  return true;
                }
                
                // si no es worker => fallback
                console.log('WorkerGuard: Usuario no es worker (rol:', normalizedRole, '), redirigiendo a login');
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
