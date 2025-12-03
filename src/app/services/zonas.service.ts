import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

export interface ZoneResponse {
  id: number;
  name: string;
  code?: string;
  codezip?: number;
  createdDate?: string;
  updatedDate?: string;
}

export interface ZonesData {
  zones: ZoneResponse[];
}

export interface ZoneData {
  zone: ZoneResponse;
}

// Mantener compatibilidad con interfaz antigua
export interface Zona {
  _id?: string;
  id?: number;
  name: string;
  description?: string;
  code?: string;
  codezip?: number;
}

export interface ZonasResponse {
  zones: Zona[];
}

@Injectable({
  providedIn: 'root'
})
export class ZonasService extends BaseService {
  private readonly endpoint = '/zone';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todas las zonas (GET /zone)
   * Retorna: { ok: true, data: { zones: [...] } }
   */
  getZones(): Observable<ApiResponse<ZonasResponse>> {
    return this.get<ZonesData>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data?.zones) {
          // Convertir ZoneResponse[] a Zona[] para compatibilidad
          const zonas: Zona[] = response.data.zones.map(z => ({
            _id: z.id?.toString(),
            id: z.id,
            name: z.name,
            code: z.code,
            codezip: z.codezip
          }));
          
          return {
            ok: true,
            data: { zones: zonas },
            error: response.error,
            message: response.message
          };
        }
        throw new Error(response.error || 'Error al obtener las zonas');
      })
    );
  }

  /**
   * Obtener zona por ID (GET /zone/:id)
   * Retorna: { ok: true, data: { zone: {...} } }
   */
  getZoneById(id: string): Observable<ApiResponse<Zona>> {
    return this.get<ZoneData>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.zone) {
          const z = response.data.zone;
          return {
            ok: true,
            data: {
              _id: z.id?.toString(),
              id: z.id,
              name: z.name,
              code: z.code,
              codezip: z.codezip
            },
            error: response.error,
            message: response.message
          };
        }
        throw new Error(response.error || 'Error al obtener la zona');
      })
    );
  }

  /**
   * Crear zona (POST /zone/create)
   * Retorna: { ok: true, data: { zone: {...} } }
   */
  createZone(zone: Partial<Zona>): Observable<ApiResponse<Zona>> {
    return this.post<ZoneData>(`${this.endpoint}/create`, zone).pipe(
      map(response => {
        if (response.ok && response.data?.zone) {
          const z = response.data.zone;
          return {
            ok: true,
            data: {
              _id: z.id?.toString(),
              id: z.id,
              name: z.name,
              code: z.code,
              codezip: z.codezip
            },
            error: response.error,
            message: response.message
          };
        }
        throw new Error(response.error || 'Error al crear la zona');
      })
    );
  }

  /**
   * Actualizar zona (PUT /zone/update/:id)
   * Retorna: { ok: true, data: { zone: {...} } }
   */
  updateZone(id: string, zone: Partial<Zona>): Observable<ApiResponse<Zona>> {
    return this.put<ZoneData>(`${this.endpoint}/update/${id}`, zone).pipe(
      map(response => {
        if (response.ok && response.data?.zone) {
          const z = response.data.zone;
          return {
            ok: true,
            data: {
              _id: z.id?.toString(),
              id: z.id,
              name: z.name,
              code: z.code,
              codezip: z.codezip
            },
            error: response.error,
            message: response.message
          };
        }
        throw new Error(response.error || 'Error al actualizar la zona');
      })
    );
  }

  /**
   * Eliminar zona (DELETE /zone/:id)
   * Retorna: { ok: true, data: { message: "..." } }
   */
  deleteZone(id: string): Observable<ApiResponse<Zona>> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => ({
        ok: response.ok || false,
        data: undefined,
        error: response.error,
        message: response.message
      }))
    );
  }
} 