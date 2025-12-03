import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Input } from '@angular/core';
import { CalendarMonthViewDay, CalendarEvent } from 'angular-calendar';
import { Subject, Subscription } from 'rxjs';
import { subMonths, addMonths, subYears, addYears } from 'date-fns';
import { NavController } from '@ionic/angular';
import { CalendarioService } from '../../../services/calendario.service';
import { RutasService } from '../../../services/rutas.service';
import { ZonasService } from '../../../services/zonas.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { Ruta } from '../../../models/ruta.model';
import { Parte } from '../../../models/parte.model';
import { ApiResponse } from '../../../models/api-response.model';
import { parseDateAsLocal } from 'src/app/shared/utils/date.utils';

@Component({
  selector: 'app-list-calendario',
  standalone: false,
  templateUrl: './list-calendario.component.html',
  styleUrls: ['./list-calendario.component.scss']
})
export class ListCalendarioComponent implements OnInit, OnDestroy {

  @ViewChild('monthCellTemplate', { static: true }) monthCellTemplate!: TemplateRef<any>;

  // (4) interfaz worker => si role=worker => no puede crear rutas ni asignar partes
  @Input() isWorker: boolean = false;

  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  refresh: Subject<any> = new Subject();

  // Para mostrar sumatoria de facturación finalizada
  factSumDay: { [key: string]: number } = {};

  // Variables existentes
  selectedDay: Date | null = null;
  rutasDelDia: Ruta[] = [];
  rutaSeleccionada: Ruta | null = null;
  partesNoAsignados: Parte[] = [];
  partesAsignadosARuta: Parte[] = [];
  enableCheckParts = false;

  // Filtro en partes no asignados
  filterZona: string = '';
  filterTipo: string = '';
  filterFactRange: string = '';
  // Lista de zonas (para select de zona)
  zonas: any[] = [];

  // Días de la semana abreviados
  weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedType: string = '';

  // Control del panel de filtros
  isFilterExpanded: boolean = false;

  // Suscripciones para poder desuscribirse
  private subscriptions: Subscription[] = [];
  private isLoadingEvents = false;
  private isLoadingZones = false;
  private isLoadingFacturacion = false;

  constructor(
    private navCtrl: NavController,
    private calendarioService: CalendarioService,
    private rutasService: RutasService,
    private zonasService: ZonasService
  ) { }

  ngOnDestroy() {
    // Desuscribirse de todas las suscripciones
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
  }

  async ngOnInit() {
    // Solo inicializar variables, no cargar datos aquí
    // Los datos se cargarán en ionViewDidEnter que es el hook correcto para Ionic
  }

  ionViewDidEnter() {
    // Este hook se ejecuta cada vez que la página entra en vista
    // Es el lugar correcto para cargar datos en Ionic
    this.loadEvents();
    this.loadZones();  // cargar la lista de zonas
    this.cargarFacturacionFinalMes(); // cargar sumatoria de facturación final
    this.selectedDay = null;
  }

  // Método para volver a la página anterior
  volver() {
    this.navCtrl.back();
  }

  // Método para cancelar la selección del día
  cancelarSeleccion() {
    this.selectedDay = null;
    this.rutaSeleccionada = null;
    this.partesAsignadosARuta = [];
    this.enableCheckParts = false;
  }

  // Método para expandir/contraer los filtros
  toggleFilters() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  // (3) Cargar la sumatoria de facturación finalizada
  cargarFacturacionFinalMes() {
    // Evitar múltiples llamadas simultáneas
    if (this.isLoadingFacturacion) {
      console.log('[ListCalendario] cargarFacturacionFinalMes ya está en ejecución, ignorando llamada duplicada');
      return;
    }
    
    this.isLoadingFacturacion = true;
    const dateStr = this.viewDate.toISOString().split('T')[0];
    try {
      const subscription = this.calendarioService.getPartesFinalizadasMonth(dateStr).subscribe({
        next: (response: any) => {
          this.isLoadingFacturacion = false;
          if (response && response.ok) {
            const partes = response.partes || response.data?.partes || [];
            this.factSumDay = {}; // Reiniciar para evitar datos antiguos
            partes.forEach((p: any) => {
              // Parsear fecha correctamente para evitar problemas de timezone
              const d = parseDateAsLocal(p.date);
              if (!d) return;
              const dayStr = this.toDateString(d);
              if (!this.factSumDay[dayStr]) this.factSumDay[dayStr] = 0;
              this.factSumDay[dayStr] += (p.facturacion || 0);
            });
          } else {
            console.error('Error en la respuesta de getPartesFinalizadasMonth:', response);
          }
        },
        error: (error) => {
          this.isLoadingFacturacion = false;
          console.error('Error al cargar partes finalizadas:', error);
        }
      });
      this.subscriptions.push(subscription);
    } catch (error) {
      this.isLoadingFacturacion = false;
      console.error('Error en cargarFacturacionFinalMes:', error);
    }
  }

  loadZones() {
    // Evitar múltiples llamadas simultáneas
    if (this.isLoadingZones) {
      console.log('[ListCalendario] loadZones ya está en ejecución, ignorando llamada duplicada');
      return;
    }
    
    this.isLoadingZones = true;
    try {
      const subscription = this.zonasService.getZones().subscribe({
        next: (response: any) => {
          this.isLoadingZones = false;
          if (response && response.ok) {
            this.zonas = response.zones || [];
          } else {
            console.error('Error en la respuesta de getZones:', response);
          }
        },
        error: (error) => {
          this.isLoadingZones = false;
          console.error('Error al cargar zonas:', error);
        }
      });
      this.subscriptions.push(subscription);
    } catch (error) {
      this.isLoadingZones = false;
      console.error('Error en loadZones:', error);
    }
  }

  loadEvents() {
    // Evitar múltiples llamadas simultáneas
    if (this.isLoadingEvents) {
      console.log('[ListCalendario] loadEvents ya está en ejecución, ignorando llamada duplicada');
      return;
    }
    
    this.isLoadingEvents = true;
    try {
      const subscription = this.rutasService.getRutas().subscribe({
        next: (rutas: any) => {
          this.isLoadingEvents = false;
          console.log('[ListCalendario] Respuesta de getRutas:', rutas);
          // getRutas() devuelve directamente un array de rutas
          if (Array.isArray(rutas)) {
            this.events = this.mapRutasToEvents(rutas);
            // Notificar al calendario que debe actualizar la vista
            this.refresh.next(null);
          } else {
            console.error('Error: getRutas no devolvió un array:', rutas);
            this.events = [];
            this.refresh.next(null);
          }
        },
        error: (error) => {
          this.isLoadingEvents = false;
          console.error('Error al cargar eventos:', error);
          this.events = [];
          // Notificar al calendario incluso en caso de error, para que no se quede bloqueado
          this.refresh.next(null);
        }
      });
      this.subscriptions.push(subscription);
    } catch (error) {
      this.isLoadingEvents = false;
      console.error('Error en loadEvents:', error);
      this.events = [];
      this.refresh.next(null);
    }
  }

  // Mapea las rutas a eventos del calendario
  mapRutasToEvents(rutas: any[]): CalendarEvent[] {
    if (!rutas || !Array.isArray(rutas)) {
      console.warn('mapRutasToEvents: rutas no es un array válido');
      return [];
    }

    return rutas.map(ruta => {
      if (!ruta) return null;

      // Si ruta.date es una fecha válida, convertirla correctamente
      let date: Date | null = null;
      if (ruta.date) {
        date = parseDateAsLocal(ruta.date);
        if (!date) {
          console.warn('Fecha inválida en ruta:', ruta);
          return null;
        }
      } else {
        // Si no existe una fecha, usamos la fecha actual
        date = new Date();
        date.setHours(0, 0, 0, 0);
      }

      return {
        start: date,
        title: ruta.name?.name || 'Ruta sin nombre',
        meta: {
          ruta: ruta
        }
      };
    }).filter(event => event !== null) as CalendarEvent[]; // Filtrar eventos nulos
  }



  previousMonth() {
    this.viewDate = subMonths(this.viewDate, 1);
    this.onMonthChange();
  }

  nextMonth() {
    this.viewDate = addMonths(this.viewDate, 1);
    this.onMonthChange();
  }

  previousYear() {
    this.viewDate = subYears(this.viewDate, 1);
    this.onMonthChange();
  }

  nextYear() {
    this.viewDate = addYears(this.viewDate, 1);
    this.onMonthChange();
  }

  goToday() {
    this.viewDate = new Date();
    this.onMonthChange();
  }

  // Método para manejar cambios de mes
  private onMonthChange() {
    const dateStr = this.toDateString(this.viewDate);
    this.cargarPartesNoAsignadosEnMes(dateStr);
    this.cargarFacturacionFinalMes();
    this.loadEvents();
  }

  dayClicked(day: CalendarMonthViewDay): void {
    // Establecer el día seleccionado
    this.selectedDay = day.date;
    const dateStr = this.toDateString(day.date);

    console.log('Día seleccionado:', dateStr, 'Eventos del día:', day.events.length);

    // Cargar rutas del día directamente desde los eventos
    if (day.events && day.events.length > 0) {
      // Obtener las rutas directamente de los metadatos de los eventos
      const rutasDirectas = day.events.map(event => event.meta.ruta).filter(ruta => ruta);
      if (rutasDirectas.length > 0) {
        console.log('Rutas obtenidas directamente de eventos:', rutasDirectas.length);
        // Normalizar rutas: agregar _id si solo tienen id
        this.rutasDelDia = rutasDirectas.map(r => {
          if (!r._id && r.id) {
            r._id = String(r.id);
          }
          return r;
        });

        // Seleccionar la primera ruta para mostrar sus detalles
        if (this.rutasDelDia.length > 0) {
          this.mostrarDetalleRuta(this.rutasDelDia[0]);
        }
      } else {
        this.rutasDelDia = [];
        this.rutaSeleccionada = null;
        this.partesAsignadosARuta = [];
      }
    } else {
      this.rutasDelDia = [];
      this.rutaSeleccionada = null;
      this.partesAsignadosARuta = [];
    }

    const rutasPrevias = [...this.rutasDelDia];

    // Además, hacer la llamada al API para asegurar que tenemos los datos más actualizados
    const subscription = this.calendarioService.getRutasByDate(dateStr).subscribe({
      next: (response: any) => {
        console.log('[ListCalendario] Respuesta de getRutasByDate en dayClicked:', response);
        const rutasAPI = response?.data?.rutas || response?.rutas || [];

        if (response?.ok && rutasAPI.length > 0) {
          console.log('Rutas obtenidas de API:', rutasAPI.length);
          // Normalizar rutas: agregar _id si solo tienen id
          this.rutasDelDia = rutasAPI.map((r:any) => {
            if (!r._id && r.id) {
              r._id = String(r.id);
            }
            return r;
          });

          const rutaSeleccionadaId = this.rutaSeleccionada ? this.getRutaId(this.rutaSeleccionada) : null;
          const rutaActual = rutaSeleccionadaId
            ? this.rutasDelDia.find(r => this.getRutaId(r) === rutaSeleccionadaId)
            : null;

          if (rutaActual) {
            this.mostrarDetalleRuta(rutaActual);
          } else if (this.rutasDelDia.length > 0) {
            this.mostrarDetalleRuta(this.rutasDelDia[0]);
          }
        } else if (!response?.ok) {
          console.error('Error en la respuesta de getRutasByDate:', response);
          this.rutasDelDia = rutasPrevias;
        } else if (rutasPrevias.length > 0) {
          // Mantener los datos provenientes del calendario si la API no trae rutas
          this.rutasDelDia = rutasPrevias;
        } else {
          console.log('No hay rutas para este día según la API');
          this.rutasDelDia = [];
          this.rutaSeleccionada = null;
          this.partesAsignadosARuta = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar rutas del día desde API:', error);
        this.rutasDelDia = rutasPrevias;
      }
    });
    this.subscriptions.push(subscription);

    // Cargar partes no asignados en paralelo
    this.cargarPartesNoAsignadosEnMes(dateStr);

    // Reiniciar estado de selección de partes
    this.enableCheckParts = false;
  }

  handleEventClick(event: CalendarEvent, $event: MouseEvent) {
    $event.stopPropagation();
    const ruta = event.meta.ruta;
    this.selectedDay = event.start;
    this.rutasDelDia = [ruta];
    this.mostrarDetalleRuta(ruta);

    const dateStr = this.toDateString(event.start);
    this.cargarPartesNoAsignadosEnMes(dateStr);
  }

  cargarRutasDelDia(dateStr: string) {
    const rutasPrevias = [...this.rutasDelDia];
    try {
      const subscription = this.calendarioService.getRutasByDate(dateStr).subscribe({
        next: (response: any) => {
          const rutasAPI = response?.data?.rutas || response?.rutas || [];
          if (response?.ok) {
            this.rutasDelDia = rutasAPI;

            if (this.rutasDelDia.length === 0) {
              this.rutaSeleccionada = null;
              this.partesAsignadosARuta = [];
              return;
            }

            // Normalizar rutas: agregar _id si solo tienen id
            this.rutasDelDia = this.rutasDelDia.map(r => {
              if (!r._id && r.id) {
                r._id = String(r.id);
              }
              return r;
            });

            const rutaSeleccionadaId = this.rutaSeleccionada ? this.getRutaId(this.rutaSeleccionada) : null;
            const rutaActual = rutaSeleccionadaId
              ? this.rutasDelDia.find(r => this.getRutaId(r) === rutaSeleccionadaId)
              : null;

            if (rutaActual) {
              this.mostrarDetalleRuta(rutaActual);
            } else {
              this.mostrarDetalleRuta(this.rutasDelDia[0]);
            }
          } else {
            console.error('Error en la respuesta de getRutasByDate:', response);
            this.rutasDelDia = rutasPrevias;
          }
        },
        error: (error: any) => {
          console.error('Error al cargar rutas del día:', error);
          this.rutasDelDia = rutasPrevias;
        }
      });
      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('Error en cargarRutasDelDia:', error);
      this.rutasDelDia = rutasPrevias;
    }
  }

  mostrarDetalleRuta(ruta: Ruta) {
    this.rutaSeleccionada = ruta;
    const rutaId = this.getRutaId(ruta);
    if (!rutaId) {
      console.error('No se pudo obtener el ID de la ruta:', ruta);
      return;
    }
    this.cargarPartesDeLaRuta(rutaId);
    this.enableCheckParts = false;
  }

  // Helper para obtener el ID de la ruta (soporta tanto id como _id)
  private getRutaId(ruta: any): string | null {
    if (!ruta) return null;
    // El backend devuelve 'id' (number), el frontend espera '_id' (string)
    if (ruta._id) return String(ruta._id);
    if (ruta.id) return String(ruta.id);
    return null;
  }

  cargarPartesDeLaRuta(rutaId: string) {
    try {
      const subscription = this.rutasService.getPartesDeRuta(rutaId).subscribe({
        next: (response: any) => {
          console.log('[ListCalendario] Respuesta getPartesDeRuta:', response);
          if (response && response.ok) {
            // Normalizar la estructura de respuesta
            if (Array.isArray(response.data)) {
              this.partesAsignadosARuta = response.data;
            } else if (response.partes) {
              this.partesAsignadosARuta = response.partes;
            } else if (response.data && response.data.partes) {
              this.partesAsignadosARuta = response.data.partes;
            } else {
              console.error('No se encontraron partes en la respuesta:', response);
              this.partesAsignadosARuta = [];
            }
          } else {
            console.error('Error en la respuesta de getPartesDeRuta:', response);
            this.partesAsignadosARuta = [];
          }
        },
        error: (error) => {
          console.error('Error al cargar partes de la ruta:', error);
          this.partesAsignadosARuta = [];
        }
      });
      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('Error en cargarPartesDeLaRuta:', error);
      this.partesAsignadosARuta = [];
    }
  }

  cargarPartesNoAsignadosEnMes(dateStr: string) {
    try {
      const subscription = this.calendarioService.getPartesNoAsignadosEnMes(dateStr)
        .subscribe({
          next: (response) => {
            if (response.ok) {
              this.partesNoAsignados = response.partes;

              // Aplicar filtros si hay datos
              if (this.partesNoAsignados.length > 0) {
                this.filtrarPartesPendientes();
              }
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
      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('Error en cargarPartesNoAsignadosEnMes:', error);
      this.partesNoAsignados = [];
    }
  }

  createRutaParaDia() {
    if (!this.selectedDay) return;
    const dateStr = this.toDateString(this.selectedDay);
    this.navCtrl.navigateForward(['/calendario/crear-ruta', dateStr]);
  }

  enableAssignPartes() {
    this.enableCheckParts = true;
    // Desmarcar todo
    this.partesNoAsignados.forEach(p => p.selected = false);
  }

  async asignarPartesARuta(parteSeleccionados: Parte[]) {
    if (!this.rutaSeleccionada || parteSeleccionados.length === 0) return;
    try {
      const rutaId = this.getRutaId(this.rutaSeleccionada);
      if (!rutaId) {
        console.error('No se pudo obtener el ID de la ruta');
        return;
      }
      
      const parteIds :any= parteSeleccionados.map(p => p._id || p.id).filter((id): id is string | number => id !== undefined && id !== null);
      
      if (parteIds.length === 0) {
        console.error('No hay IDs válidos para asignar');
        return;
      }
      
      const subscription = this.rutasService.asignarPartesARuta(rutaId, parteIds).subscribe({
        next: (response: any) => {
          console.log('[ListCalendario] Respuesta de asignarPartesARuta:', response);
          if (response && response.ok) {
            // Actualizar la vista: recargar partes de la ruta
            const rutaIdToReload = this.getRutaId(this.rutaSeleccionada!);
            if (rutaIdToReload) {
              this.cargarPartesDeLaRuta(rutaIdToReload);
            }
            
            // Recargar partes no asignados para actualizar la lista
            if (this.selectedDay) {
              const dateStr = this.toDateString(this.selectedDay);
              this.cargarPartesNoAsignadosEnMes(dateStr);
            }
            
            // Desmarcar los partes seleccionados
            parteSeleccionados.forEach(p => p.selected = false);
            this.enableCheckParts = false;
          } else {
            console.error('Error al asignar partes a ruta:', response?.error || response);
          }
        },
        error: (error) => {
          console.error('Error al asignar partes a ruta:', error);
        }
      });
      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('Error en asignarPartesARuta:', error);
    }
  }

  toggleRuta(ruta: Ruta) {
    if (this.rutaSeleccionada === ruta) {
      this.rutaSeleccionada = null;
    } else {
      this.mostrarDetalleRuta(ruta);
    }
  }

  getSelectedNoAsignados(): Parte[] {
    return this.partesNoAsignados?.filter((p) => p.selected) || [];
  }

  filtrarPartesPendientes() {
    // Aplica el filtro localmente
    let temp = [...this.partesNoAsignados];

    // Filtro por zona (p.customer.zone == filterZona)
    if (this.filterZona) {
      temp = temp.filter(p => {
        const customer = typeof p.customer === 'object' ? p.customer : null;
        return customer?.zone && (typeof customer.zone === 'object' ? customer.zone._id === this.filterZona : customer.zone === this.filterZona);
      });
    }
    // Filtro por tipo
    if (this.filterTipo) {
      temp = temp.filter(p => p.type === this.filterTipo);
    }
    // Filtro por facturación
    if (this.filterFactRange) {
      temp = temp.filter(p => {
        const f = p.facturacion || 0;
        if (this.filterFactRange === 'lt100') return f < 100;
        if (this.filterFactRange === 'bt100_500') return (f >= 100 && f <= 500);
        if (this.filterFactRange === 'gt500') return f > 500;
        return true;
      });
    }
    this.partesNoAsignados = temp;
  }

  parseDateAsUTC(dateStr: string): Date {
    const date = parseDateAsLocal(dateStr);
    return date || new Date();
  }

  toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTipoRutaClass(tipo: string): string {
    switch (tipo) {
      case 'Mantenimiento':
        return 'tipo-mantenimiento';
      case 'Obra':
        return 'tipo-obra';
      case 'Correctivo':
        return 'tipo-correctivo';
      case 'Visitas':
        return 'tipo-visitas';
      default:
        return 'tipo-default';
    }
  }

  // Método para obtener el icono según el tipo de ruta
  getTipoRutaIcon(tipo: string): string {
    switch (tipo) {
      case 'Mantenimiento':
        return 'construct-outline';
      case 'Obra':
        return 'hammer-outline';
      case 'Correctivo':
        return 'build-outline';
      case 'Visitas':
        return 'eye-outline';
      default:
        return 'trail-sign-outline';
    }
  }

  getFactSum(d: Date): number {
    return this.factSumDay[this.toDateString(d)] || 0;
  }

  onDateChange(event: any) {
    this.selectedDate = event;
    this.applyFilters();
  }

  applyFilters() {
    // Actualizar la vista del calendario con la fecha seleccionada
    this.viewDate = this.parseDateAsUTC(this.selectedDate);

    // Recargar los eventos con la nueva fecha
    this.loadEvents();

    // Si hay un día seleccionado, actualizar los datos para ese día
    if (this.selectedDay) {
      const dateStr = this.toDateString(this.selectedDay);
      this.cargarRutasDelDia(dateStr);
      this.cargarPartesNoAsignadosEnMes(dateStr);
    }

    // Actualizar la facturación del mes
    this.cargarFacturacionFinalMes();
  }

  getCustomerName(parte: Parte): string {
    return typeof parte.customer === 'object' ? parte.customer?.name || 'Sin cliente' : 'Sin cliente';
  }

  getRutaName(ruta: any): string {
    if (!ruta) return 'Ruta sin nombre';
    if (typeof ruta === 'string') return ruta;
    return ruta.name?.name || ruta.name || 'Ruta sin nombre';
  }

  getVehicleInfo(vehicle: any): string {
    if (!vehicle) return 'Sin vehículo';
    if (typeof vehicle === 'string') return vehicle;
    return `${vehicle.brand || ''} - ${vehicle.matricula || ''}`.trim() || 'Sin vehículo';
  }
}
