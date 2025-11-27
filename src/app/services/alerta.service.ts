import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { Alerta } from '../models/alerta.model';

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
   */
  getAlertas(): Observable<Alerta[]> {
    return this.get<{ ok: boolean; data: { alertas: Alerta[] } }>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data && response.data.alertas) {
          return response.data.alertas;
        }
        throw new Error('Error al obtener las alertas');
      })
    );
  }

  /**
   * Actualizar alerta (PUT /alertas/:id)
   */
  updateAlerta(alertaId: string, data: Partial<Alerta>): Observable<Alerta> {
    return this.put<{ ok: boolean; data: { alerta: Alerta } }>(`${this.endpoint}/${alertaId}`, data).pipe(
      map(response => {
        if (response.ok && response.data && response.data.alerta) {
          return response.data.alerta;
        }
        throw new Error('Error al actualizar la alerta');
      })
    );
  }
}
