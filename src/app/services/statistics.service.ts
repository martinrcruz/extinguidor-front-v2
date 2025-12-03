import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, from, switchMap, map } from 'rxjs';

// Interfaz que coincide con el DTO del backend
interface DashboardStatsDTO {
  totalPartes: number;
  pendingPartes: number;
  inProcessPartes: number;
  finishedPartes: number;
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRoutes: number;
  pendingRoutes: number;
  inProcessRoutes: number;
  finishedRoutes: number;
  totalUsers: number;
  activeUsers: number;
  totalWorkers: number;
  totalFacturacion: number;
  facturacionThisMonth: number;
  facturacionLastMonth: number;
  partesByType: { [key: string]: number };
  partesByCategory: { [key: string]: number };
  partesByState: { [key: string]: number };
  unassignedPartes: number;
  periodicPartes: number;
}

export interface DashboardStats {
  totalPartes: number;
  partesCompletados: number;
  partesPendientes: number;
  partesEnProgreso: number;
  totalClientes: number;
  totalRutas: number;
  rutasActivas: number;
  totalTrabajadores: number;
  facturacionMensual: number;
  facturacionAnual: number;
  eficienciaPromedio: number;
  alertasActivas: number;
}

// Interfaz que coincide con el DTO del backend
interface WorkerStatsDTO {
  workerId: number;
  workerName: string;
  workerEmail: string;
  workerPhoto?: string;
  totalPartes: number;
  pendingPartes: number;
  inProcessPartes: number;
  completedPartes: number;
  totalRoutes: number;
  activeRoutes: number;
  totalFacturacion: number;
  lastActivity: string;
  isActive: boolean;
}

export interface WorkerStats {
  workerId: number;
  workerName: string;
  workerEmail: string;
  totalPartesAsignados: number;
  partesCompletados: number;
  partesPendientes: number;
  partesEnProgreso: number;
  totalRutasAsignadas: number;
  rutasCompletadas: number;
  eficiencia: number;
  promedioTiempoCompletado: number;
  ultimaActividad: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly baseUrl = `${environment.apiUrl}/statistics`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtener estadísticas del dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return from(this.authService.getHeaders()).pipe(
      switchMap(opts =>
        this.http.get<DashboardStatsDTO>(`${this.baseUrl}/dashboard`, opts)
      ),
      map((dto: DashboardStatsDTO) => {
        // Calcular eficiencia promedio (porcentaje de partes completados)
        const eficienciaPromedio = dto.totalPartes > 0 
          ? (dto.finishedPartes / dto.totalPartes) * 100 
          : 0;
        
        // Calcular rutas activas (pendientes + en proceso)
        const rutasActivas = (dto.pendingRoutes || 0) + (dto.inProcessRoutes || 0);
        
        return {
          totalPartes: dto.totalPartes || 0,
          partesCompletados: dto.finishedPartes || 0,
          partesPendientes: dto.pendingPartes || 0,
          partesEnProgreso: dto.inProcessPartes || 0,
          totalClientes: dto.totalCustomers || 0,
          totalRutas: dto.totalRoutes || 0,
          rutasActivas: rutasActivas,
          totalTrabajadores: dto.totalWorkers || 0,
          facturacionMensual: dto.facturacionThisMonth || 0,
          facturacionAnual: dto.totalFacturacion || 0,
          eficienciaPromedio: eficienciaPromedio,
          alertasActivas: 0 // No disponible en el DTO actual
        } as DashboardStats;
      })
    );
  }

  /**
   * Obtener estadísticas de todos los trabajadores
   */
  getWorkersStats(): Observable<WorkerStats[]> {
    return from(this.authService.getHeaders()).pipe(
      switchMap(opts =>
        this.http.get<WorkerStatsDTO[]>(`${this.baseUrl}/workers`, opts)
      ),
      map((dtos: WorkerStatsDTO[]) => {
        return dtos.map((dto: WorkerStatsDTO) => {
          // Calcular eficiencia (porcentaje de partes completados)
          const eficiencia = dto.totalPartes > 0 
            ? (dto.completedPartes / dto.totalPartes) * 100 
            : 0;
          
          return {
            workerId: dto.workerId,
            workerName: dto.workerName,
            workerEmail: dto.workerEmail,
            totalPartesAsignados: dto.totalPartes || 0,
            partesCompletados: dto.completedPartes || 0,
            partesPendientes: dto.pendingPartes || 0,
            partesEnProgreso: dto.inProcessPartes || 0,
            totalRutasAsignadas: dto.totalRoutes || 0,
            rutasCompletadas: (dto.totalRoutes || 0) - (dto.activeRoutes || 0),
            eficiencia: eficiencia,
            promedioTiempoCompletado: 0, // No disponible en el DTO actual
            ultimaActividad: dto.lastActivity || ''
          } as WorkerStats;
        });
      })
    );
  }

  /**
   * Obtener estadísticas de un trabajador específico
   */
  getWorkerStats(workerId: number): Observable<WorkerStats> {
    return from(this.authService.getHeaders()).pipe(
      switchMap(opts =>
        this.http.get<WorkerStats>(`${this.baseUrl}/workers/${workerId}`, opts)
      )
    );
  }
}

