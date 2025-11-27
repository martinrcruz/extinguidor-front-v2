import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, from, switchMap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** Cabeceras como Observable */
  private getHeaders$(): Observable<any> {
    return from(this.authService.getHeaders());
  }

  /* ------------------------------------------------------------------
   * RUTAS
   * ------------------------------------------------------------------ */

  /** GET /rutas */
  getRutas(): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.get<any>(`${this.baseUrl}/rutas`, opts)
      )
    );
  }

  /** POST /rutas/create */
  createRuta(data: any): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.post<any>(`${this.baseUrl}/rutas/create`, data, opts)
      )
    );
  }

  /** GET /rutas/:id */
  getRutaById(id: string): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.get<any>(`${this.baseUrl}/rutas/${id}`, opts)
      )
    );
  }

  /** PUT /rutas/update/:id */
  updateRuta( data: any): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.post<any>(`${this.baseUrl}/rutas/update`, data, opts)
      )
    );
  }

  /** DELETE /rutas/:id */
  deleteRuta(id: string): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.delete<any>(`${this.baseUrl}/rutas/${id}`, opts)
      )
    );
  }

  /** GET /rutas/worker/:workerId[?date=YYYY-MM-DD] */
  getRutasByWorker(workerId: string, date?: string): Observable<any> {
    const url = date
      ? `${this.baseUrl}/rutas/worker/${workerId}?date=${date}`
      : `${this.baseUrl}/rutas/worker/${workerId}`;
    return this.getHeaders$().pipe(
      switchMap(opts => this.http.get<any>(url, opts))
    );
  }

  /** GET /rutas/:id/partes */
  getPartesDeRuta(rutaId: string): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.get<any>(`${this.baseUrl}/rutas/${rutaId}/partes`, opts)
      )
    );
  }

  /** POST /rutas/:id/asignarPartes */
  asignarPartesARuta(rutaId: string, parteIds: string[]): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.post<any>(
          `${this.baseUrl}/rutas/${rutaId}/asignarPartes`,
          { parteIds },
          opts
        )
      )
    );
  }

  /** GET /rutas/disponibles?date=YYYY-MM-DD */
  getRutasDisponibles(dateStr: string): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.get<any>(
          `${this.baseUrl}/rutas/disponibles?date=${dateStr}`,
          opts
        ).pipe(
          // Normalizar formato para garantizar que siempre haya un arreglo de rutas accesible
          map((response:any) => {
            const rutas = response?.data?.rutas || response?.rutas || [];
            return {
              ...response,
              ok: response?.ok !== false,
              rutas
            };
          })
        )
      )
    );
  }

  /* ------------------------------------------------------------------
   * RUTAS N
   * ------------------------------------------------------------------ */

  /** GET /rutasn */
  getRutasN(): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts => this.http.get<any>(`${this.baseUrl}/rutasn`, opts))
    );
  }

  /** POST /rutasn/create */
  createRutaN(data: any): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.post<any>(`${this.baseUrl}/rutasn/create`, data, opts)
      )
    );
  }

  /** DELETE /rutasn/:id */
  deleteRutaN(id: string): Observable<any> {
    return this.getHeaders$().pipe(
      switchMap(opts =>
        this.http.delete<any>(`${this.baseUrl}/rutasn/${id}`, opts)
      )
    );
  }
}
