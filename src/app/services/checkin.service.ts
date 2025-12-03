import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, from, switchMap } from 'rxjs';
import { BaseService } from './base.service';

export interface Checkin {
  id?: number;
  userId: number;
  reportId?: number;
  checkInTime: string;
  checkOutTime?: string;
  location?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  createdDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckinService extends BaseService {
  private readonly endpoint = '/checkin';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Listar todos los checkins
   */
  getAllCheckins(): Observable<Checkin[]> {
    return this.get<Checkin[]>(`${this.endpoint}/list`);
  }

  /**
   * Obtener checkin por ID
   */
  getCheckinById(id: number): Observable<Checkin> {
    return this.get<Checkin>(`${this.endpoint}/${id}`);
  }

  /**
   * Listar checkins por reporte
   */
  getCheckinsByReport(reportId: number): Observable<Checkin[]> {
    return this.get<Checkin[]>(`${this.endpoint}/report/${reportId}`);
  }

  /**
   * Listar checkins por usuario
   */
  getCheckinsByUser(userId: number): Observable<Checkin[]> {
    return this.get<Checkin[]>(`${this.endpoint}/user/${userId}`);
  }

  /**
   * Crear checkin
   */
  createCheckin(checkin: Partial<Checkin>): Observable<Checkin> {
    return this.post<Checkin>(this.endpoint, checkin);
  }

  /**
   * Actualizar checkin
   */
  updateCheckin(id: number, checkin: Partial<Checkin>): Observable<Checkin> {
    return this.put<Checkin>(`${this.endpoint}/${id}`, checkin);
  }

  /**
   * Eliminar checkin
   */
  deleteCheckin(id: number): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Hacer check-in (registrar entrada)
   */
  checkIn(userId: number, location?: string, latitude?: number, longitude?: number): Observable<Checkin> {
    return this.createCheckin({
      userId,
      checkInTime: new Date().toISOString(),
      location,
      latitude,
      longitude
    });
  }

  /**
   * Hacer check-out (registrar salida)
   */
  checkOut(checkinId: number, notes?: string): Observable<Checkin> {
    return this.updateCheckin(checkinId, {
      checkOutTime: new Date().toISOString(),
      notes
    });
  }
}

