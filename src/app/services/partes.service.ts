import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { Parte, Cliente } from '../models/parte.model';

export interface ParteResponse {
  id: number;
  title: string;
  description?: string;
  date: string;
  customer?: {
    id: number;
    name: string;
    code: string;
    email: string;
  };
  address?: string;
  state: string;
  type?: string;
  categoria?: string;
  asignado?: boolean;
  eliminado?: boolean;
  periodico?: boolean;
  frequency?: string;
  endDate?: string;
  coordinationMethod?: string;
  gestiona?: number;
  facturacion?: number;
  ruta?: {
    id: number;
    name: string;
    date: string;
  };
  worker?: {
    id: number;
    name: string;
    code: string;
    email: string;
  };
  finalizadoTime?: string;
  comentarios?: Array<{
    texto: string;
    fecha: string;
    usuario: number;
  }>;
  documentos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
    fecha: string;
  }>;
  articulos?: Array<{
    cantidad: number;
    codigo: string;
    grupo: string;
    familia: string;
    descripcionArticulo: string;
    precioVenta: number;
  }>;
  createdDate?: string;
  updatedDate?: string;
}

export interface PartesData {
  partes: ParteResponse[];
  totalPages?: number;
  totalItems?: number;
}

export interface ParteData {
  parte: ParteResponse;
}

@Injectable({
  providedIn: 'root'
})
export class PartesService extends BaseService {
  private readonly endpoint = '/partes';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todas las partes (GET /partes?page=0&limit=10)
   * Retorna: { ok: true, data: { partes: [...], totalPages: X, totalItems: Y } }
   */
  getPartes(page: number = 0, limit: number = 10): Observable<PartesData> {
    return this.get<PartesData>(`${this.endpoint}?page=${page}&limit=${limit}`).pipe(
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
   * Retorna: { ok: true, data: { parte: {...} } }
   */
  getParteById(id: string): Observable<Parte> {
    return this.get<ParteData>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.parte) {
          // Convertir ParteResponse a Parte para compatibilidad
          return this.convertParteResponseToParte(response.data.parte);
        }
        throw new Error(response.error || 'Error al obtener el parte');
      })
    );
  }

  /**
   * Crear parte (POST /partes/create)
   * Retorna: { ok: true, data: { parte: {...} } }
   */
  createParte(data: Partial<Parte>): Observable<Parte> {
    return this.post<ParteData>(`${this.endpoint}/create`, data).pipe(
      map(response => {
        if (response.ok && response.data?.parte) {
          return this.convertParteResponseToParte(response.data.parte);
        }
        throw new Error(response.error || 'Error al crear el parte');
      })
    );
  }

  /**
   * Actualizar parte (POST /partes/update/{id})
   * Retorna: { ok: true, data: { parte: {...} } }
   */
  updateParte(id: string, data: Partial<Parte>): Observable<Parte> {
    return this.post<ParteData>(`${this.endpoint}/update/${id}`, data).pipe(
      map(response => {
        if (response.ok && response.data?.parte) {
          return this.convertParteResponseToParte(response.data.parte);
        }
        throw new Error(response.error || 'Error al actualizar el parte');
      })
    );
  }

  /**
   * Eliminar parte (DELETE /partes/:id)
   * Retorna: { ok: true, data: { message: "..." } }
   */
  deleteParte(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar el parte');
      })
    );
  }

  /**
   * Obtener partes no asignados (GET /partes/noasignados?date=YYYY-MM-DD)
   * Retorna: { ok: true, data: { partes: [...] } }
   */
  getPartesNoAsignados(date?: string): Observable<Parte[]> {
    const url = date 
      ? `${this.endpoint}/noasignados?date=${date}`
      : `${this.endpoint}/noasignados`;
    return this.get<PartesData>(url).pipe(
      map(response => {
        if (response.ok && response.data?.partes) {
          return response.data.partes.map(p => this.convertParteResponseToParte(p));
        }
        throw new Error(response.error || 'Error al obtener los partes no asignados');
      })
    );
  }

  /**
   * Subir archivo a parte (POST /partes/upload)
   * Retorna: { ok: true, data: { parte: {...} } }
   */
  uploadParteFile(formData: FormData): Observable<Parte> {
    // Para FormData, pasar isFormData=true
    return this.post<ParteData>(`${this.endpoint}/upload`, formData, true).pipe(
      map(response => {
        if (response.ok && response.data?.parte) {
          return this.convertParteResponseToParte(response.data.parte);
        }
        throw new Error(response.error || 'Error al subir el archivo');
      })
    );
  }

  /**
   * Obtener partes por trabajador (GET /partes/worker/:workerId?date=YYYY-MM-DD)
   * Retorna: { ok: true, data: { partes: [...] } }
   */
  getPartesByWorker(workerId: string, date?: string): Observable<Parte[]> {
    const url = date
      ? `${this.endpoint}/worker/${workerId}?date=${date}`
      : `${this.endpoint}/worker/${workerId}`;
    return this.get<PartesData>(url).pipe(
      map(response => {
        if (response.ok && response.data?.partes) {
          return response.data.partes.map(p => this.convertParteResponseToParte(p));
        }
        throw new Error(response.error || 'Error al obtener los partes del trabajador');
      })
    );
  }

  /**
   * Actualizar estado de parte (PUT /partes/:id/status)
   * Retorna: { ok: true, data: { parte: {...} } }
   */
  updateParteStatus(parteId: string, status: string): Observable<Parte> {
    return this.put<ParteData>(`${this.endpoint}/${parteId}/status`, { status }).pipe(
      map(response => {
        if (response.ok && response.data?.parte) {
          return this.convertParteResponseToParte(response.data.parte);
        }
        throw new Error(response.error || 'Error al actualizar el estado del parte');
      })
    );
  }

  /**
   * Convierte ParteResponse (DTO del backend) a Parte (modelo del frontend)
   */
  public convertParteResponseToParte(parteResponse: ParteResponse): Parte {
    return {
      _id: parteResponse.id?.toString(),
      id: parteResponse.id,
      title: parteResponse.title,
      description: parteResponse.description || '',
      date: parteResponse.date,
      customer: parteResponse.customer ? {
        _id: parteResponse.customer.id?.toString(),
        name: parteResponse.customer.name,
        email: parteResponse.customer.email,
        nifCif: '',
        phone: '',
        address: '',
        code: parteResponse.customer.code
      } as Cliente : undefined,
      address: parteResponse.address,
      state: parteResponse.state,
      type: parteResponse.type,
      categoria: parteResponse.categoria,
      asignado: parteResponse.asignado,
      eliminado: parteResponse.eliminado,
      periodico: parteResponse.periodico,
      frequency: parteResponse.frequency,
      endDate: parteResponse.endDate,
      coordinationMethod: parteResponse.coordinationMethod,
      gestiona: parteResponse.gestiona,
      facturacion: parteResponse.facturacion,
      ruta: parteResponse.ruta ? {
        _id: parteResponse.ruta.id?.toString(),
        id: parteResponse.ruta.id,
        name: parteResponse.ruta.name,
        date: parteResponse.ruta.date
      } : undefined,
      worker: parteResponse.worker ? {
        _id: parteResponse.worker.id?.toString(),
        id: parteResponse.worker.id,
        name: parteResponse.worker.name,
        code: parteResponse.worker.code,
        email: parteResponse.worker.email
      } : undefined,
      finalizadoTime: parteResponse.finalizadoTime,
      comentarios: parteResponse.comentarios,
      documentos: parteResponse.documentos,
      articulos: parteResponse.articulos,
      createdDate: parteResponse.createdDate,
      updatedDate: parteResponse.updatedDate
    } as Parte;
  }
} 