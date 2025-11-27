import { Component, OnInit, TemplateRef, ViewChild, Input } from '@angular/core';
import { CalendarMonthViewDay, CalendarEvent } from 'angular-calendar';
import { Subject } from 'rxjs';
import { subMonths, addMonths, subYears, addYears } from 'date-fns';
import { NavController } from '@ionic/angular';
import { CalendarioService } from '../../../services/calendario.service';
import { RutasService } from '../../../services/rutas.service';
import { ZonasService } from '../../../services/zonas.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { Ruta } from '../../../models/ruta.model';
import { Parte } from '../../../models/parte.model';
import { ApiResponse } from '../../../interfaces/api-response.interface';
import { parseDateAsLocal } from 'src/app/shared/utils/date.utils';

@Component({
  selector: 'app-list-calendario',
  standalone: false,
  templateUrl: './list-calendario.component.html',
  styleUrls: ['./list-calendario.component.scss']
})
export class ListCalendarioComponent implements OnInit {

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

  constructor(
    private navCtrl: NavController,
    private calendarioService: CalendarioService,
    private rutasService: RutasService,
    private zonasService: ZonasService
  ) { }

  async ngOnInit() {
    this.loadEvents();
    this.loadZones();  // cargar la lista de zonas
    this.cargarFacturacionFinalMes(); // cargar sumatoria de facturación final
  }

  ionViewDidEnter() {
    this.loadEvents();
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
  async cargarFacturacionFinalMes() {
    const dateStr = this.viewDate.toISOString().split('T')[0];
    try {
      const req = await this.calendarioService.getPartesFinalizadasMonth(dateStr);
      req.subscribe((response: any) => {
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
      }, error => {
        console.error('Error al cargar partes finalizadas:', error);
      });
    } catch (error) {
      console.error('Error en cargarFacturacionFinalMes:', error);
    }
  }

  async loadZones() {
    try {
      const req = await this.zonasService.getZones();
      req.subscribe((response: any) => {
        if (response && response.ok) {
          this.zonas = response.zones || [];
        } else {
          console.error('Error en la respuesta de getZones:', response);
        }
      }, error => {
        console.error('Error al cargar zonas:', error);
      });
    } catch (error) {
      console.error('Error en loadZones:', error);
    }
  }

  async loadEvents() {
    try {
      const req = await this.rutasService.getRutas();
      req.subscribe((response: any) => {
        console.log(response)
        if (response && response.ok) {
          // Normalizar la estructura de respuesta
          if (response.rutas) {
            this.events = this.mapRutasToEvents(response.rutas);
          } else if (response.data && response.data.rutas) {
            this.events = this.mapRutasToEvents(response.data.rutas);
          } else {
            console.error('No se encontraron rutas en la respuesta:', response);
            this.events = [];
          }
          // Notificar al calendario que debe actualizar la vista
          this.refresh.next(null);
        } else {
          console.error('Error en la respuesta de getRutas:', response);
          this.events = [];
        }
      }, error => {
        console.error('Error al cargar eventos:', error);
        this.events = [];
        // Notificar al calendario incluso en caso de error, para que no se quede bloqueado
        this.refresh.next(null);
      });
    } catch (error) {
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
        this.rutasDelDia = rutasDirectas;

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
    this.calendarioService.getRutasByDate(dateStr).subscribe({
      next: (response: any) => {
        console.log('Respuesta de getRutasByDate en dayClicked:', response);
        const rutasAPI = response?.data?.rutas || response?.rutas || [];

        if (response?.ok && rutasAPI.length > 0) {
          console.log('Rutas obtenidas de API:', rutasAPI.length);
          this.rutasDelDia = rutasAPI;

          const rutaActual = this.rutaSeleccionada?._id
            ? this.rutasDelDia.find(r => r._id === this.rutaSeleccionada!._id)
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

  async cargarRutasDelDia(dateStr: string) {
    const rutasPrevias = [...this.rutasDelDia];
    try {
      const req = await this.calendarioService.getRutasByDate(dateStr);
      req.subscribe({
        next: (response: any) => {
          const rutasAPI = response?.data?.rutas || response?.rutas || [];
          if (response?.ok) {
            this.rutasDelDia = rutasAPI;

            if (this.rutasDelDia.length === 0) {
              this.rutaSeleccionada = null;
              this.partesAsignadosARuta = [];
              return;
            }

            const rutaActual = this.rutaSeleccionada?._id
              ? this.rutasDelDia.find(r => r._id === this.rutaSeleccionada!._id)
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
    } catch (error) {
      console.error('Error en cargarRutasDelDia:', error);
      this.rutasDelDia = rutasPrevias;
    }
  }

  mostrarDetalleRuta(ruta: Ruta) {
    this.rutaSeleccionada = ruta;
    this.cargarPartesDeLaRuta(ruta._id);
    this.enableCheckParts = false;
  }

  async cargarPartesDeLaRuta(rutaId: string) {
    try {
      const req = await this.rutasService.getPartesDeRuta(rutaId);
      req.subscribe((response: any) => {
        console.log(response)
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
      }, error => {
        console.error('Error al cargar partes de la ruta:', error);
        this.partesAsignadosARuta = [];
      });
    } catch (error) {
      console.error('Error en cargarPartesDeLaRuta:', error);
      this.partesAsignadosARuta = [];
    }
  }

  async cargarPartesNoAsignadosEnMes(dateStr: string) {
    try {
      this.calendarioService.getPartesNoAsignadosEnMes(dateStr)
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
      const req = await this.rutasService.asignarPartesARuta(
        this.rutaSeleccionada._id,
        parteSeleccionados.map(p => p._id)
      );
      req.subscribe((response: any) => {
        if (response && response.ok) {
          // Actualizar la vista
          this.cargarPartesDeLaRuta(this.rutaSeleccionada!._id);
          // Recargar partes no asignados
          if (this.selectedDay) {
            const dateStr = this.toDateString(this.selectedDay);
            this.cargarPartesNoAsignadosEnMes(dateStr);
          }
        } else {
          console.error('Error al asignar partes a ruta:', response);
        }
      }, error => {
        console.error('Error al asignar partes a ruta:', error);
      });
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
      temp = temp.filter(p => p.customer?.zone === this.filterZona);
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
}
