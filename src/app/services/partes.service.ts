import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Parte } from '../models/parte.model';

@Injectable({
  providedIn: 'root'
})
export class PartesService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private async getHeaders() {
    return await this.authService.getHeaders();
  }

  /**
   * Obtener todas las partes (GET /partes)
   */
  async getPartes(): Promise<Observable<any>> {
    const opts = await this.getHeaders();
    return this.http.get<any>(`${this.baseUrl}/partes`, opts).pipe(
      map(response => {
        if (response.ok && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Error al obtener los partes');
      })
    );
  }

  /**
   * Obtener parte por ID (GET /partes/:id)
   */
  async getParteById(id: string): Promise<Observable<Parte>> {
    const opts = await this.getHeaders();
    return this.http.get<any>(`${this.baseUrl}/partes/${id}`, opts).pipe(
      map(response => {
        // Manejar formato estandarizado { ok: true, data: { parte } }
        const parte = response.data?.parte || response.parte;
        if (response.ok && parte) {
          return parte;
        }
        throw new Error(response.error || 'Error al obtener el parte');
      })
    );
  }

  /**
   * Crear parte (POST /partes/create)
   */
  async createParte(data: Partial<Parte>): Promise<Observable<any>> {
    const opts = await this.getHeaders();
    return this.http.post<any>(`${this.baseUrl}/partes/create`, data, opts).pipe(
      map(response => {
        console.log('Respuesta del servidor:', response);
        if (response.ok) {
          // El backend devuelve { ok: true, data: { parte: parteDB } }
          return response;
        }
        throw new Error(response.error || 'Error al crear el parte');
      })
    );
  }

  /**
   * Actualizar parte (PUT /partes/update/:id)
   */
  async updateParte(data: Partial<Parte>): Promise<Observable<Parte>> {
    const opts = await this.getHeaders();
    return this.http.post<any>(`${this.baseUrl}/partes/update`, data, opts).pipe(
      map((response: any) => {
        // Manejar formato estandarizado { ok: true, data: { parte } }
        const parte = response.data?.parte || response.data;
        if (response.ok && parte) {
          return parte;
        }
        throw new Error(response.error || 'Error al actualizar el parte');
      })
    );
  }

  /**
   * Eliminar parte (DELETE /partes/:id)
   */
  async deleteParte(id: string): Promise<Observable<any>> {
    const opts = await this.getHeaders();
    return this.http.delete<any>(`${this.baseUrl}/partes/${id}`, opts).pipe(
      map(response => {
        if (response.ok) {
          return response;
        }
        throw new Error(response.error || 'Error al eliminar el parte');
      })
    );
  }

  /**
   * Obtener partes no asignados (GET /partes/noasignados)
   */
  async getPartesNoAsignados(): Promise<Observable<Parte[]>> {
    const opts = await this.getHeaders();
    return this.http.get<any>(`${this.baseUrl}/partes/noasignados`, opts).pipe(
      map((response: any) => {
        // Manejar formato estandarizado { ok: true, data: { partes } }
        const partes = response.data?.partes || response.partes || [];
        if (response.ok) {
          return partes;
        }
        throw new Error(response.error || 'Error al obtener los partes no asignados');
      })
    );
  }

  /**
   * Subir archivo a parte (POST /partes/upload)
   */
  async uploadParteFile(formData: FormData): Promise<Observable<Parte>> {
    const opts = await this.getHeaders();
    return this.http.post<ApiResponse<Parte>>(`${this.baseUrl}/partes/upload`, formData, opts).pipe(
      map(response => {
        if (response.ok && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Error al subir el archivo');
      })
    );
  }

  /**
   * Obtener partes por trabajador (GET /partes/worker/:workerId)
   */
  async getPartesByWorker(workerId: string): Promise<Observable<Parte[]>> {
    const opts = await this.getHeaders();
    return this.http.get<any>(`${this.baseUrl}/partes/worker/${workerId}`, opts).pipe(
      map((response: any) => {
        // Manejar formato estandarizado { ok: true, data: { partes } }
        const partes = response.data?.partes || response.partes || [];
        if (response.ok) {
          return partes;
        }
        throw new Error(response.error || 'Error al obtener los partes del trabajador');
      })
    );
  }

  /**
   * Actualizar estado de parte (PUT /partes/:id/status)
   */
  async updateParteStatus(parteId: string, status: string): Promise<Observable<Parte>> {
    const opts = await this.getHeaders();
    return this.http.put<any>(`${this.baseUrl}/partes/${parteId}/status`, { status }, opts).pipe(
      map((response: any) => {
        // Manejar formato estandarizado { ok: true, data: { parte } }
        const parte = response.data?.parte || response.parte || response.data;
        if (response.ok && parte) {
          return parte;
        }
        throw new Error(response.error || 'Error al actualizar el estado del parte');
      })
    );
  }
} 