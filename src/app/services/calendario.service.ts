import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of, from } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { map, catchError, retry, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService  {
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
  }

  // Obtiene las rutas programadas para una fecha específica
  getRutasByDate(date: string): Observable<ApiResponse<any>> {
    return from(this.authService.getHeaders()).pipe(
      switchMap(opts =>
        this.http.get<any>(`${environment.apiUrl}/partes/calendario/${date}/rutas`, opts).pipe(
          retry(1),
          map(response => {
            // Manejar formato estandarizado { ok: true, data: { rutas } }
            const rutas = response.data?.rutas || response.rutas || [];
            return {
              ok: response.ok !== false,
              data: { rutas }
            };
          }),
          catchError(error => {
            console.error('Error en getRutasByDate:', error);
            return of({
              ok: false,
              error: error.error?.message || error.message || 'Error al obtener rutas',
              data: { rutas: [] }
            });
          })
        )
      )
    );
  }

  // Obtiene los partes no asignados en un mes
  getPartesNoAsignadosEnMes(date: string): Observable<{ok: boolean, partes: any[]}> {
    return from(this.authService.getHeaders()).pipe(
      switchMap(opts =>
        this.http.get<any>(`${environment.apiUrl}/partes/calendario/${date}/partes-no-asignados`, opts).pipe(
          retry(1),
          map((response: any) => {
            // Manejar formato estandarizado { ok: true, data: { partes } } o { ok: true, partes }
            const partes = response.data?.partes || response.partes || [];
            return {
              ok: response.ok !== false,
              partes
            };
          }),
          catchError(error => {
            console.error('Error en getPartesNoAsignadosEnMes:', error);
            return of({
              ok: false,
              partes: []
            });
          })
        )
      )
    );
  }

  // Obtiene los partes finalizados en un mes (para facturación)
  getPartesFinalizadasMonth(date: string): Observable<ApiResponse<any>> {
    return from(this.authService.getHeaders()).pipe(
      switchMap(opts =>
        this.http.get<any>(`${environment.apiUrl}/partes/calendario/${date}/partes-finalizados`, opts).pipe(
          retry(1),
          map(response => {
            // Manejar formato estandarizado { ok: true, data: { partes } } o { ok: true, partes }
            const partes = response.data?.partes || response.partes || [];
            return {
              ok: response.ok !== false,
              data: { partes }
            };
          }),
          catchError(error => {
            console.error('Error en getPartesFinalizadasMonth:', error);
            return of({
              ok: false,
              error: error.error?.message || error.message || 'Error al obtener partes finalizados',
              data: { partes: [] }
            });
          })
        )
      )
    );
  }
} 