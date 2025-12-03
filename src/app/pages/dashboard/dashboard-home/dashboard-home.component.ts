import { Component, OnInit } from '@angular/core';
import { StatisticsService, DashboardStats, WorkerStats } from '../../../services/statistics.service';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard-home',
  standalone: false,
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss'],
})
export class DashboardHomeComponent implements OnInit {
  stats: DashboardStats | null = null;
  workersStats: WorkerStats[] = [];
  loading = false;
  userRole: any

  constructor(
    private statisticsService: StatisticsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.userRole = this.authService.getRole();
    this.loadDashboardStats();
    
    if (this.userRole === 'ADMIN') {
      this.loadWorkersStats();
    }
  }

  async loadDashboardStats() {
    this.loading = true;
    try {
      this.stats = await firstValueFrom(this.statisticsService.getDashboardStats());
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadWorkersStats() {
    try {
      this.workersStats = await firstValueFrom(this.statisticsService.getWorkersStats());
    } catch (error) {
      console.error('Error al cargar estadísticas de trabajadores:', error);
    }
  }

  getEficienciaColor(eficiencia: number): string {
    if (eficiencia >= 90) return 'success';
    if (eficiencia >= 70) return 'warning';
    return 'danger';
  }

  getPartesCompletadosPercentage(): number {
    if (!this.stats || this.stats.totalPartes === 0) return 0;
    return (this.stats.partesCompletados / this.stats.totalPartes) * 100;
  }

  async doRefresh(event: any) {
    await this.loadDashboardStats();
    if (this.userRole === 'ADMIN') {
      await this.loadWorkersStats();
    }
    event.target.complete();
  }
}
