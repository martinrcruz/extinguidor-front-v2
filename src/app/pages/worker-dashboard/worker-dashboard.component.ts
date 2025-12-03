import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { WorkerDashboardService } from '../../services/worker-dashboard.service';
import { AuthService } from '../../services/auth.service';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Parte } from '../../models/parte.model';
import { parseDateAsLocal } from 'src/app/shared/utils/date.utils';

interface Ruta {
  _id: string;
  name: {
    _id: string;
    name: string;
    __v: number;
  };
  state: string;
  date: string;
  users: Array<{
    _id: string;
    name: string;
    code: string;
    photo: string;
    role: string;
    email: string;
    phone: string;
    activo: boolean;
    junior: boolean;
    __v: number;
  }>;
  vehicle: {
    _id: string;
    fuel: string;
    type: string;
    modelo: string;
    brand: string;
    photo: string;
    matricula: string;
    createdDate: string;
    __v: number;
  };
  comentarios: string;
  herramientas: any[];
  eliminado: boolean;
  __v: number;
  expanded?: boolean;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  partes?: T;
  rutas?: T;
}

@Component({
  selector: 'app-worker-dashboard',
  templateUrl: './worker-dashboard.component.html',
  styleUrls: ['./worker-dashboard.component.scss'],
  standalone: false
})
export class WorkerDashboardComponent implements OnInit, OnDestroy {
  partes: Parte[] = [];
  rutas: Ruta[] = [];
  error = '';
  currentDate: Date = new Date();
  formattedDate: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private navCtrl: NavController,
    private workerDashboardService: WorkerDashboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateFormattedDate();
    this.loadWorkerData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  updateFormattedDate() {
    this.formattedDate = format(this.currentDate, 'MMMM yyyy', { locale: es });
  }

  previousMonth() {
    this.currentDate = subMonths(this.currentDate, 1);
    this.updateFormattedDate();
    this.partes = [];
    this.rutas = [];
    this.loadWorkerData();
  }

  nextMonth() {
    this.currentDate = addMonths(this.currentDate, 1);
    this.updateFormattedDate();
    this.partes = [];
    this.rutas = [];
    this.loadWorkerData();
  }

  goToCurrentMonth() {
    this.currentDate = new Date();
    this.updateFormattedDate();
    this.partes = [];
    this.rutas = [];
    this.loadWorkerData();
  }

  async loadWorkerData() {
    try {
      this.error = '';
      const startDate = format(startOfMonth(this.currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(this.currentDate), 'yyyy-MM-dd');

      // Crear observables para partes y rutas
      const partesReq = await this.workerDashboardService.getPartesDelDia(startDate);
      const rutasReq = await this.workerDashboardService.getRutasDelDia(startDate);

      // Usar forkJoin para manejar ambas peticiones
      const subscription = forkJoin({
        partes: partesReq.pipe(
          catchError(error => {
            console.error('Error al cargar partes:', error);
            return of({ ok: false, error: 'Error al cargar los partes' } as ApiResponse<Parte[]>);
          })
        ),
        rutas: rutasReq.pipe(
          catchError(error => {
            console.error('Error al cargar rutas:', error);
            return of({ ok: false, error: 'Error al cargar las rutas' } as ApiResponse<Ruta[]>);
          })
        )
      }).subscribe({
        next: (results) => {
        console.log('Results:', results);
          // Procesar partes
          if (results.partes.ok && results.partes.partes) {
            this.partes = results.partes.partes.filter((parte: Parte) => {
              const parteDate = parseDateAsLocal(parte.date);
              if (!parteDate) return false;
              const start = parseDateAsLocal(startDate);
              const end = parseDateAsLocal(endDate);
              if (!start || !end) return false;
              return parteDate >= start && parteDate <= end;
            });
          } else {
            this.error = results.partes.error || 'Error al cargar los partes';
          }

          console.log('Partes cargadas:', this.partes); // Para debugging
          // Procesar rutas
          if (results.rutas.ok && results.rutas.rutas) {
            this.rutas = results.rutas.rutas.filter((ruta: Ruta) => {
              const rutaDate = parseDateAsLocal(ruta.date);
              if (!rutaDate) return false;
              const start = parseDateAsLocal(startDate);
              const end = parseDateAsLocal(endDate);
              if (!start || !end) return false;
              return rutaDate >= start && rutaDate <= end;
            });
            console.log('Rutas cargadas:', this.rutas);
          } else {
            this.error = results.rutas.error || 'Error al cargar las rutas';
          }
        },
        error: (error) => {
          console.error('Error general:', error);
          this.error = 'Error al cargar los datos';
        }
      });

      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('Error:', error);
      this.error = 'Error al cargar los datos';
    }
  }

  async updateParteStatus(parteId: string, newStatus: 'Pendiente' | 'EnProceso' | 'Finalizado') {
    if (!parteId) return;
    
    try {
      const req = await this.workerDashboardService.updateParteStatus(parteId, newStatus);
      const subscription = req.subscribe({
        next: (res: ApiResponse<Parte>) => {
          if (res.ok && res.data) {
            const parte = this.partes.find(p => p._id === parteId);
            if (parte) {
              parte.state = newStatus;
            }
          } else {
            this.error = res.error || 'Error al actualizar el estado';
          }
        },
        error: (error) => {
          console.error('Error al actualizar estado:', error);
          this.error = 'Error al actualizar el estado';
        }
      });

      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('Error:', error);
      this.error = 'Error al actualizar el estado';
    }
  }

  doRefresh(event: any) {
    this.loadWorkerData();
    event.target.complete();
  }

  async logout() {
    await this.authService.logout();
    this.navCtrl.navigateRoot('/login');
  }

  toggleRutaPartes(ruta: Ruta) {
    ruta.expanded = !ruta.expanded;
  }

  getPartesDeRuta(rutaId: string): Parte[] {
    return this.partes.filter(parte => {
      if (!parte.ruta) return false;
      const rutaObj = typeof parte.ruta === 'object' ? parte.ruta : null;
      return rutaObj?._id === rutaId;
    });
  }
} 