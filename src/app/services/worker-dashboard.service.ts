import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Observable, of, throwError, timer, OperatorFunction } from 'rxjs';
import { catchError, map, retryWhen, delayWhen, tap } from 'rxjs/operators';
import { Parte } from '../models/parte.model';

// Interfaces para tipado fuerte
interface Ruta {
  _id: string;
  name: {
    _id: string;
    name: string;
    __v: number;
  };
  state: string;
  date: string;
  users: Array<{
    _id: string;
    name: string;
    code: string;
    photo: string;
    role: string;
    email: string;
    phone: string;
    activo: boolean;
    junior: boolean;
    __v: number;
  }>;
  vehicle: {
    _id: string;
    fuel: string;
    type: string;
    modelo: string;
    brand: string;
    photo: string;
    matricula: string;
    createdDate: string;
    __v: number;
  };
  comentarios: string;
  herramientas: any[];
  eliminado: boolean;
  __v: number;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  partes?: T;
  rutas?: T;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerDashboardService {
  private baseUrl = environment.apiUrl;
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 100; // Máximo número de elementos en caché
  private readonly MAX_RETRIES = 3; // Número máximo de reintentos
  private readonly RETRY_DELAY = 1000; // Delay entre reintentos en ms

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private async getHeaders() {
    return await this.authService.getHeaders();
  }

  private getCacheKey(endpoint: string, params: any = {}): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private setCache(key: string, data: any) {
    // Limpiar caché si excede el tamaño máximo
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en WorkerDashboardService:', error);
    return throwError(() => ({
      ok: false,
      error: error.error?.message || error.message || 'Error desconocido'
    }));
  }

  private retryStrategy<T>(): OperatorFunction<T, T> {
    return retryWhen(errors =>
      errors.pipe(
        delayWhen(() => timer(this.RETRY_DELAY)),
        tap(error => console.log('Reintentando después de error:', error)),
        map((error, index) => {
          if (index >= this.MAX_RETRIES) {
            throw error;
          }
          return error;
        })
      )
    );
  }

  /**
   * Obtener partes asignados al worker (GET /partes/worker/:workerId)
   */
  async getPartesAsignados(): Promise<Observable<ApiResponse<Parte[]>>> {
    const userId = await this.authService.getCurrentUserId();
    const cacheKey = this.getCacheKey('partes_asignados', { userId });
    const cached = this.getCache(cacheKey);
    if (cached) return of(cached);

    const opts = await this.getHeaders();
    return this.http.get<ApiResponse<Parte[]>>(`${this.baseUrl}/partes/worker/${userId}`, opts).pipe(
      map(res => {
        this.setCache(cacheKey, res);
        return res;
      }),
      this.retryStrategy<ApiResponse<Parte[]>>(),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener rutas asignadas al worker (GET /rutas/worker/:workerId)
   */
  async getRutasAsignadas(): Promise<Observable<ApiResponse<Ruta[]>>> {
    const userId = await this.authService.getCurrentUserId();
    const cacheKey = this.getCacheKey('rutas_asignadas', { userId });
    const cached = this.getCache(cacheKey);
    if (cached) return of(cached);

    const opts = await this.getHeaders();
    return this.http.get<ApiResponse<Ruta[]>>(`${this.baseUrl}/rutas/worker/${userId}`, opts).pipe(
      map(res => {
        this.setCache(cacheKey, res);
        return res;
      }),
      this.retryStrategy<ApiResponse<Ruta[]>>(),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar estado de parte (PUT /partes/:id/status)
   */
  async updateParteStatus(parteId: string, status: 'Pendiente' | 'EnProceso' | 'Finalizado'): Promise<Observable<ApiResponse<Parte>>> {
    const opts = await this.getHeaders();
    return this.http.put<ApiResponse<Parte>>(`${this.baseUrl}/partes/${parteId}/status`, { status }, opts).pipe(
      map(res => {
        this.cache.clear();
        return res;
      }),
      this.retryStrategy<ApiResponse<Parte>>(),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener partes del día (GET /partes/worker/:workerId)
   */
  async getPartesDelDia(date: string): Promise<Observable<ApiResponse<Parte[]>>> {
    const userId = await this.authService.getCurrentUserId();
    const cacheKey = this.getCacheKey('partes_dia', { userId, date });
    const cached = this.getCache(cacheKey);
    if (cached) return of(cached);

    const opts = await this.getHeaders();
    return this.http.get<ApiResponse<Parte[]>>(`${this.baseUrl}/partes/worker/${userId}?date=${date}`, opts).pipe(
      map(res => {
        if (res.ok) {
          this.setCache(cacheKey, res);
        }
        return res;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener rutas del día (GET /rutas/worker/:workerId)
   */
  async getRutasDelDia(date: string): Promise<Observable<ApiResponse<Ruta[]>>> {
    const userId = await this.authService.getCurrentUserId();
    const cacheKey = this.getCacheKey('rutas_dia', { userId, date });
    const cached = this.getCache(cacheKey);
    if (cached) return of(cached);

    const opts = await this.getHeaders();
    return this.http.get<ApiResponse<Ruta[]>>(`${this.baseUrl}/rutas/worker/${userId}?date=${date}`, opts).pipe(
      map(res => {
        if (res.ok) {
          this.setCache(cacheKey, res);
        }
        return res;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Agregar comentario a parte (POST /partes/:id/comentario)
   */
  async agregarComentario(parteId: string, comentario: string): Promise<Observable<ApiResponse<Parte>>> {
    const opts = await this.getHeaders();
    return this.http.post<ApiResponse<Parte>>(`${this.baseUrl}/partes/${parteId}/comentario`, { comentario }, opts).pipe(
      map(res => {
        this.cache.clear();
        return res;
      }),
      this.retryStrategy<ApiResponse<Parte>>(),
      catchError(this.handleError)
    );
  }

  /**
   * Subir documento a parte (POST /partes/:id/documento)
   */
  async subirDocumento(parteId: string, formData: FormData): Promise<Observable<ApiResponse<Parte>>> {
    const opts = await this.getHeaders();
    return this.http.post<ApiResponse<Parte>>(`${this.baseUrl}/partes/${parteId}/documento`, formData, opts).pipe(
      map(res => {
        this.cache.clear();
        return res;
      }),
      this.retryStrategy<ApiResponse<Parte>>(),
      catchError(this.handleError)
    );
  }
} 