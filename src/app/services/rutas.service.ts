import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/api-response.model';

export interface RouteResponse {
  id: number;
  encargado?: {
    id: number;
    name: string;
    code: string;
    email: string;
  };
  name?: {
    id: number;
    name: string;
  };
  date: string;
  state?: string;
  vehicle?: {
    id: number;
    modelo: string;
    brand: string;
    matricula: string;
  };
  users?: Array<{
    id: number;
    name: string;
    code: string;
    email: string;
  }>;
  comentarios?: string;
  herramientas?: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  eliminado?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface RutasData {
  rutas: RouteResponse[];
}

export interface RutaData {
  ruta: RouteResponse;
}

export interface PartesData {
  partes: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RutasService extends BaseService {
  private readonly endpoint = '/rutas';
  private readonly endpointRutasN = '/rutasn';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /* ------------------------------------------------------------------
   * RUTAS
   * ------------------------------------------------------------------ */

  /** GET /rutas - Retorna: { ok: true, data: { rutas: [...] } } */
  getRutas(): Observable<RouteResponse[]> {
    return this.get<RutasData>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data?.rutas) {
          return response.data.rutas;
        }
        throw new Error(response.error || 'Error al obtener las rutas');
      })
    );
  }

  /** POST /rutas/create - Retorna: { ok: true, data: { ruta: {...} } } */
  createRuta(data: any): Observable<RouteResponse> {
    return this.post<RutaData>(`${this.endpoint}/create`, data).pipe(
      map(response => {
        if (response.ok && response.data?.ruta) {
          return response.data.ruta;
        }
        throw new Error(response.error || 'Error al crear la ruta');
      })
    );
  }

  /** GET /rutas/:id - Retorna: { ok: true, data: { ruta: {...} } } */
  getRutaById(id: string): Observable<RouteResponse> {
    return this.get<RutaData>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.ruta) {
          return response.data.ruta;
        }
        throw new Error(response.error || 'Error al obtener la ruta');
      })
    );
  }

  /** POST /rutas/update/:id - Retorna: { ok: true, data: { ruta: {...} } } */
  updateRuta(data: any): Observable<RouteResponse> {
    return this.post<RutaData>(`${this.endpoint}/update/${data.id || data._id}`, data).pipe(
      map(response => {
        if (response.ok && response.data?.ruta) {
          return response.data.ruta;
        }
        throw new Error(response.error || 'Error al actualizar la ruta');
      })
    );
  }

  /** DELETE /rutas/:id */
  deleteRuta(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar la ruta');
      })
    );
  }

  /** GET /rutas/worker/:workerId[?date=YYYY-MM-DD] - Retorna: { ok: true, data: { rutas: [...] } } */
  getRutasByWorker(workerId: string, date?: string): Observable<RouteResponse[]> {
    const url = date
      ? `${this.endpoint}/worker/${workerId}?date=${date}`
      : `${this.endpoint}/worker/${workerId}`;
    return this.get<RutasData>(url).pipe(
      map(response => {
        if (response.ok && response.data?.rutas) {
          return response.data.rutas;
        }
        throw new Error(response.error || 'Error al obtener las rutas del trabajador');
      })
    );
  }

  /** GET /rutas/:id/partes - Retorna: { ok: true, data: { partes: [...] } } */
  getPartesDeRuta(rutaId: string): Observable<any> {
    return this.get<PartesData>(`${this.endpoint}/${rutaId}/partes`).pipe(
      map(response => {
        // Devolver la respuesta completa para que el componente pueda manejarla
        return response;
      }),
      catchError(error => {
        console.error('Error en getPartesDeRuta:', error);
        // Devolver una respuesta de error en el formato esperado
        return of({
          ok: false,
          error: error.message || 'Error al obtener los partes de la ruta',
          data: { partes: [] }
        });
      })
    );
  }

  /** POST /rutas/:id/asignarPartes - Retorna: { ok: true, data: { message: "..." } } */
  asignarPartesARuta(rutaId: string, parteIds: string[] | number[]): Observable<any> {
    return this.post<{ message: string }>(
      `${this.endpoint}/${rutaId}/asignarPartes`,
      { parteIds }
    ).pipe(
      map(response => {
        // Devolver la respuesta completa para que el componente pueda manejarla
        return response;
      }),
      catchError(error => {
        console.error('Error en asignarPartesARuta:', error);
        // Devolver una respuesta de error en el formato esperado
        return of({
          ok: false,
          error: error.message || 'Error al asignar partes a la ruta',
          data: { message: '' }
        });
      })
    );
  }

  /** GET /rutas/disponibles?date=YYYY-MM-DD - Retorna: { ok: true, data: { rutas: [...] } } */
  getRutasDisponibles(dateStr: string): Observable<RouteResponse[]> {
    return this.get<RutasData>(`${this.endpoint}/disponibles?date=${dateStr}`).pipe(
      map(response => {
        if (response.ok && response.data?.rutas) {
          return response.data.rutas;
        }
        throw new Error(response.error || 'Error al obtener las rutas disponibles');
      })
    );
  }

  /* ------------------------------------------------------------------
   * RUTAS N
   * ------------------------------------------------------------------ */

  /** GET /rutasn - Retorna: { ok: true, data: { rutasN: [...] } } */
  getRutasN(): Observable<any[]> {
    return this.get<{ rutasN: any[] }>(this.endpointRutasN).pipe(
      map(response => {
        if (response.ok && response.data?.rutasN) {
          return response.data.rutasN;
        }
        throw new Error(response.error || 'Error al obtener las rutas N');
      })
    );
  }

  /** POST /rutasn/create - Retorna: { ok: true, data: { rutaN: {...} } } */
  createRutaN(data: any): Observable<any> {
    return this.post<{ rutaN: any }>(`${this.endpointRutasN}/create`, data).pipe(
      map(response => {
        if (response.ok && response.data?.rutaN) {
          return response.data.rutaN;
        }
        throw new Error(response.error || 'Error al crear la ruta N');
      })
    );
  }

  /** DELETE /rutasn/:id - Retorna: { ok: true, data: { message: "..." } } */
  deleteRutaN(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpointRutasN}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar la ruta N');
      })
    );
  }
}
