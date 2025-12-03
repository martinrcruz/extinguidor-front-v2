import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  protected baseUrl = environment.apiUrl;

  constructor(
    protected http: HttpClient,
    protected authService: AuthService
  ) {}

  protected async getHeaders(isFormData: boolean = false): Promise<{ headers: HttpHeaders }> {
    const token = await this.authService.getToken();
    const headers: { [key: string]: string } = {
      'x-token': token || '',
      'Accept': 'application/json'
    };
    
    // No establecer Content-Type para FormData, el navegador lo hace automáticamente
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return {
      headers: new HttpHeaders(headers)
    };
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la petición:', error);

    if (error.status === 429) {
      return throwError(() => 'Demasiadas peticiones. Por favor, intente nuevamente en unos momentos.');
    }

    if (error.status === 401) {
      this.authService.logout();
      return throwError(() => 'Sesión expirada. Por favor, inicie sesión nuevamente.');
    }

    if (error.status === 403) {
      return throwError(() => 'No tiene permisos para realizar esta acción.');
    }

    if (error.status === 500) {
      return throwError(() => 'Error interno del servidor. Por favor, intente nuevamente más tarde.');
    }

    // Si el error viene en formato StandardApiResponse
    if (error.error && typeof error.error === 'object' && 'ok' in error.error && !error.error.ok) {
      return throwError(() => error.error.error || error.error.message || 'Error en el servidor');
    }

    return throwError(() => error.error?.message || error.error?.error || 'Error en el servidor');
  }

  /**
   * Maneja respuestas StandardApiResponse del backend
   * Extrae automáticamente el data cuando ok es true
   */
  protected handleApiResponse<T>(response: ApiResponse<T>): T {
    if (response && response.ok !== false) {
      if (response.data !== undefined) {
        return response.data;
      }
      // Si no hay data pero ok es true, retornar la respuesta completa
      return response as any;
    }
    throw new Error(response.error || response.message || 'Error en la respuesta del servidor');
  }

  /**
   * GET request que maneja StandardApiResponse
   */
  protected get<T>(url: string): Observable<ApiResponse<T>> {
    return from(this.getHeaders()).pipe(
      switchMap(opts => 
        this.http.get<ApiResponse<T>>(`${this.baseUrl}${url}`, opts)
      ),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET request que retorna directamente el data extraído
   */
  protected getData<T>(url: string): Observable<T> {
    return this.get<T>(url).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * POST request que maneja StandardApiResponse
   */
  protected post<T>(url: string, data: any, isFormData: boolean = false): Observable<ApiResponse<T>> {
    return from(this.getHeaders(isFormData)).pipe(
      switchMap(opts => 
        this.http.post<ApiResponse<T>>(`${this.baseUrl}${url}`, data, opts)
      ),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * POST request que retorna directamente el data extraído
   */
  protected postData<T>(url: string, data: any, isFormData: boolean = false): Observable<T> {
    return this.post<T>(url, data, isFormData).pipe(
      map(response => this.handleApiResponse(response))
    );
  }


  /**
   * PUT request que maneja StandardApiResponse
   */
  protected put<T>(url: string, data: any): Observable<ApiResponse<T>> {
    return from(this.getHeaders()).pipe(
      switchMap(opts => 
        this.http.put<ApiResponse<T>>(`${this.baseUrl}${url}`, data, opts)
      ),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * PUT request que retorna directamente el data extraído
   */
  protected putData<T>(url: string, data: any): Observable<T> {
    return this.put<T>(url, data).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * DELETE request que maneja StandardApiResponse
   */
  protected delete<T>(url: string): Observable<ApiResponse<T>> {
    return from(this.getHeaders()).pipe(
      switchMap(opts => 
        this.http.delete<ApiResponse<T>>(`${this.baseUrl}${url}`, opts)
      ),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * DELETE request que retorna directamente el data extraído
   */
  protected deleteData<T>(url: string): Observable<T> {
    return this.delete<T>(url).pipe(
      map(response => this.handleApiResponse(response))
    );
  }
} 