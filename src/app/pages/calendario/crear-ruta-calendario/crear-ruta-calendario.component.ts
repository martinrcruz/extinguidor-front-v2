import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { RutasService } from '../../../services/rutas.service';
import { CalendarioService } from '../../../services/calendario.service';
import { VehiculosService, Vehicle } from '../../../services/vehiculos.service';

import { Ruta } from '../../../models/ruta.model';
import { Parte } from '../../../models/parte.model';
import { ApiResponse } from '../../../models/api-response.model';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HerramientasService } from 'src/app/services/herramientas.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-crear-ruta-calendario',
  standalone: false,
  templateUrl: './crear-ruta-calendario.component.html',
  styleUrls: ['./crear-ruta-calendario.component.scss']
})
export class CrearRutaCalendarioComponent implements OnInit {
  date: string = '';
  rutaNId: string = '';
  type: string = '';
  state: string = 'Pendiente'; // default
  selectedVehicle: string = '';
  selectedUsers: string[] = [];
  selectedEncargado: string = '';
  selectedHerramientas: any[] = [];
  comentario: string = '';

  // Listas para selects
  rutasN: any[] = [];
  vehicles: Vehicle[] = [];
  users: any[] = [];
  herramientas: any[] = [];
  // Partes no asignados
  partesNoAsignados: Parte[] = [];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private rutasService: RutasService,
    private calendarioService: CalendarioService,
    private vehiculosService: VehiculosService,
    private usuariosService: UserService,
    private herramientasService: HerramientasService
  ) {}

  async ngOnInit() {
    // Obtenemos la fecha desde la URL (param: 'date')
    this.date = this.route.snapshot.paramMap.get('date') || '';

    // Cargar RutaN
    const rnReq = await this.rutasService.getRutasN();
    rnReq.subscribe((res: any) => {
      if (res.ok && res.rutas) {
        this.rutasN = res.rutas;
      }
    });

    try {
      // Cargar Vehicles
      this.vehiculosService.getVehicles().subscribe(
        (vehicles: Vehicle[]) => {
          // Filtrar vehículos no eliminados y disponibles
          this.vehicles = vehicles.filter(v => 
            !v.eliminado && 
            (!v.status || v.status === 'Disponible')
          );
        },
        (error) => {
          console.error('Error al cargar vehículos:', error);
          // Mostrar mensaje de error al usuario si es necesario
        }
      );

      // Cargar Users
      const usrReq = await this.usuariosService.getAllUsers();
      usrReq.subscribe((res: any) => {
        if (res.ok && res.data.users) {
          this.users = res.data.users;
        }
      });

      // Cargar Partes No Asignados del mes actual y meses anteriores
      await this.loadPartesNoAsignados();
      this.getHerramientas();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  getHerramientas(){
   this.herramientasService.getHerramientas().subscribe((res: any) => {
    console.log(res.data.herramientas)
    if (res.ok && res.data.herramientas) {
      this.herramientas = res.data.herramientas;
    }
   })
    
  }

  async loadPartesNoAsignados() {
    try {
      console.log(this.date)
      this.calendarioService.getPartesNoAsignadosEnMes(this.date)
        .subscribe({
          next: (response) => {
            if (response.ok) {
              this.partesNoAsignados = response.partes;
              
            } else {
              console.error('Error en la respuesta de getPartesNoAsignadosEnMes:', response);
              this.partesNoAsignados = [];
            }
          },
          error: (error) => {
            console.error('Error al cargar partes no asignados:', error);
            this.partesNoAsignados = [];
          }
        });
    } catch (error) {
      console.error('Error en cargarPartesNoAsignadosEnMes:', error);
      this.partesNoAsignados = [];
    }
  }

  // Obtener array con fechas de los últimos n meses en formato YYYY-MM-DD
  private getLastMonths(months: number): string[] {
    const dates: string[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < months; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  async createRuta() {
    try {
      if (!this.rutaNId) {
        console.error('No se seleccionó un RutaN');
        return;
      }

      if (!this.selectedEncargado) {
        console.error('No se seleccionó un encargado');
        return;
      }

      // Obtener los partes seleccionados
      const selectedPartes = this.partesNoAsignados.filter(p => p.selected);

      // Preparar datos enviando solo IDs (no objetos completos)
      // La fecha se envía como string YYYY-MM-DD
      const data = {
        date: this.date, // String en formato YYYY-MM-DD
        name: this.rutaNId, // Solo ID de RutaN
        type: this.type,
        state: this.state,
        vehicle: this.selectedVehicle || null, // Solo ID del vehículo o null
        users: this.selectedUsers, // Array de IDs de usuarios
        encargado: this.selectedEncargado, // Solo ID del encargado
        comentarios: this.comentario,
        herramientas: this.selectedHerramientas, // Array de IDs de herramientas
        eliminado: false
      };

      // Crear la ruta y luego asignar los partes
      this.rutasService.createRuta(data).pipe(
        switchMap((response: any) => {
          console.log('Respuesta crear ruta:', response);
          // Verificar formato de respuesta estandarizado { ok: true, data: { ruta } }
          const rutaId = response.data?.ruta?._id || response.ruta?._id;
          if (response.ok && rutaId && selectedPartes.length > 0) {
            // Si hay partes seleccionados y la ruta se creó correctamente, asignarlos
            return this.rutasService.asignarPartesARuta(
              rutaId,
              selectedPartes.map(p => p._id).filter((id): id is string => id !== undefined)
            );
          }
          return new Observable(subscriber => subscriber.next(response));
        })
      ).subscribe(
        (response: any) => {
          console.log('Respuesta final:', response);
          if (response.ok) {
            this.navCtrl.navigateBack('/calendario');
          } else {
            console.error('Error al crear ruta o asignar partes:', response.error || response.message);
          }
        },
        (error) => {
          console.error('Error al crear ruta o asignar partes:', error);
        }
      );

    } catch (error) {
      console.error('Error:', error);
    }
  }

  cancelar() {
    this.navCtrl.back();
  }

  getCustomerName(parte: Parte): string {
    return typeof parte.customer === 'object' ? parte.customer?.name || 'Sin cliente' : 'Sin cliente';
  }
}
