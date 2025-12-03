import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { Alerta } from '../models/alerta.model';
import { ApiResponse } from '../models/api-response.model';

export interface AlertResponse {
  id: number;
  message: string;
  state: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface AlertsData {
  alertas: AlertResponse[];
}

export interface AlertData {
  alerta: AlertResponse;
}

@Injectable({
  providedIn: 'root'
})
export class AlertaService extends BaseService {
  private readonly endpoint = '/alertas';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener alertas (GET /alertas)
   * Retorna: { ok: true, data: { alertas: [...] } }
   */
  getAlertas(): Observable<Alerta[]> {
    return this.get<AlertsData>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data?.alertas) {
          // Convertir AlertResponse[] a Alerta[] para compatibilidad
          return response.data.alertas.map(a => ({
            _id: a.id?.toString(),
            id: a.id,
            message: a.message,
            state: a.state as 'Pendiente' | 'Cerrado',
            createdDate: a.createdDate ? new Date(a.createdDate) : new Date(),
            updatedDate: a.updatedDate ? new Date(a.updatedDate) : undefined
          } as Alerta));
        }
        throw new Error(response.error || 'Error al obtener las alertas');
      })
    );
  }

  /**
   * Crear alerta (POST /alertas)
   * Retorna: { ok: true, data: { alerta: {...} } }
   */
  createAlerta(data: Partial<Alerta>): Observable<Alerta> {
    return this.post<AlertData>(this.endpoint, data).pipe(
      map(response => {
        if (response.ok && response.data?.alerta) {
          const a = response.data.alerta;
          return {
            _id: a.id?.toString(),
            id: a.id,
            message: a.message,
            state: a.state as 'Pendiente' | 'Cerrado',
            createdDate: a.createdDate ? new Date(a.createdDate) : new Date(),
            updatedDate: a.updatedDate ? new Date(a.updatedDate) : undefined
          } as Alerta;
        }
        throw new Error(response.error || 'Error al crear la alerta');
      })
    );
  }

  /**
   * Actualizar alerta (PUT /alertas/:id)
   * Retorna: { ok: true, data: { alerta: {...} } }
   */
  updateAlerta(alertaId: string, data: Partial<Alerta>): Observable<Alerta> {
    return this.put<AlertData>(`${this.endpoint}/${alertaId}`, data).pipe(
      map(response => {
        if (response.ok && response.data?.alerta) {
          const a = response.data.alerta;
          return {
            _id: a.id?.toString(),
            id: a.id,
            message: a.message,
            state: a.state as 'Pendiente' | 'Cerrado',
            createdDate: a.createdDate ? new Date(a.createdDate) : new Date(),
            updatedDate: a.updatedDate ? new Date(a.updatedDate) : undefined
          } as Alerta;
        }
        throw new Error(response.error || 'Error al actualizar la alerta');
      })
    );
  }

  /**
   * Eliminar alerta (DELETE /alertas/:id)
   * Retorna: { ok: true, data: { message: "..." } }
   */
  deleteAlerta(alertaId: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${alertaId}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar la alerta');
      })
    );
  }
}
