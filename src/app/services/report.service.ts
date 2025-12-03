import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

export interface Report {
  id?: number;
  customerId: number;
  routeId?: number;
  userId: number;
  workerId?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  type: 'MAINTENANCE' | 'INSPECTION' | 'INSTALLATION' | 'REPAIR';
  title: string;
  description: string;
  observations?: string;
  recommendations?: string;
  createdDate?: string;
  updatedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService extends BaseService {
  private readonly endpoint = '/report';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Listar todos los reportes
   */
  getAllReports(): Observable<Report[]> {
    return this.get<Report[]>(`${this.endpoint}/list`);
  }

  /**
   * Obtener reporte por ID
   */
  getReportById(id: number): Observable<Report> {
    return this.get<Report>(`${this.endpoint}/${id}`);
  }

  /**
   * Listar reportes por cliente
   */
  getReportsByCustomer(customerId: number): Observable<Report[]> {
    return this.get<Report[]>(`${this.endpoint}/customer/${customerId}`);
  }

  /**
   * Listar reportes por ruta
   */
  getReportsByRoute(routeId: number): Observable<Report[]> {
    return this.get<Report[]>(`${this.endpoint}/route/${routeId}`);
  }

  /**
   * Listar reportes por usuario
   */
  getReportsByUser(userId: number): Observable<Report[]> {
    return this.get<Report[]>(`${this.endpoint}/user/${userId}`);
  }

  /**
   * Listar reportes por estado
   */
  getReportsByStatus(status: string): Observable<Report[]> {
    return this.get<Report[]>(`${this.endpoint}/status/${status}`);
  }

  /**
   * Listar reportes por tipo
   */
  getReportsByType(type: string): Observable<Report[]> {
    return this.get<Report[]>(`${this.endpoint}/type/${type}`);
  }

  /**
   * Listar reportes por trabajador
   */
  getReportsByWorker(workerId: number): Observable<Report[]> {
    return this.get<Report[]>(`${this.endpoint}/worker/${workerId}`);
  }

  /**
   * Crear reporte
   */
  createReport(report: Partial<Report>): Observable<Report> {
    return this.post<Report>(this.endpoint, report);
  }

  /**
   * Actualizar reporte
   */
  updateReport(id: number, report: Partial<Report>): Observable<Report> {
    return this.put<Report>(`${this.endpoint}/${id}`, report);
  }

  /**
   * Actualizar estado de reporte
   */
  updateReportStatus(id: number, status: string): Observable<Report> {
    return this.put<Report>(`${this.endpoint}/${id}/status`, status);
  }

  /**
   * Eliminar reporte
   */
  deleteReport(id: number): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }
}

