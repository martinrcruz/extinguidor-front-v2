import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, NavController } from '@ionic/angular';
import { VehiculosService } from '../../../services/vehiculos.service';
import { firstValueFrom } from 'rxjs';
import { isoDateOnly } from 'src/app/shared/utils/date.utils';

@Component({
  selector: 'app-list-vehiculo',
  standalone: false,
  templateUrl: './list-vehiculo.component.html',
  styleUrls: ['./list-vehiculo.component.scss'],
})
export class ListVehiculoComponent implements OnInit {
  vehiculos: any[] = [];
  filteredVehiculos: any[] = [];
  errorMessage: string = '';
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedDate: string = '';

  constructor(
    private vehiculoService: VehiculosService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    // Solo inicializar variables, no cargar datos aquí
    // Los datos se cargarán en ionViewDidEnter que es el hook correcto para Ionic
  }
  
  ionViewDidEnter(){
    // Este hook se ejecuta cada vez que la página entra en vista
    // Es el lugar correcto para cargar datos en Ionic
    this.cargarVehiculos();
  }

  async cargarVehiculos() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando vehículos...'
    });
    await loading.present();

    try {
      const response = await firstValueFrom(this.vehiculoService.getVehicles());
      console.log(response)
      // getVehicles() ya devuelve un array directamente, no response.data
      this.vehiculos = Array.isArray(response) ? response : [];
      this.filteredVehiculos = [...this.vehiculos];
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      this.errorMessage = 'Error al cargar los vehículos. Por favor, intente nuevamente.';
    } finally {
      await loading.dismiss();
    }
  }

  filtrar(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.searchTerm = searchTerm;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    this.filteredVehiculos = this.vehiculos.filter(vehiculo => {
      const matchesSearch = vehiculo.matricula.toLowerCase().includes(this.searchTerm) ||
                          vehiculo.marca.toLowerCase().includes(this.searchTerm) ||
                          vehiculo.modelo.toLowerCase().includes(this.searchTerm);
      
      const matchesStatus = !this.selectedStatus || vehiculo.estado === this.selectedStatus;
      
      const matchesDate = !this.selectedDate || 
                         isoDateOnly(vehiculo.fechaMantenimiento) === this.selectedDate;
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  navegarACrear() {
    this.navCtrl.navigateForward('/vehiculos/create');
  }

  navegarAEditar(id: string) {
    this.navCtrl.navigateForward(`/vehiculos/edit/${id}`);
  }

  async eliminarVehiculo(id: string) {
    const toast = await this.toastCtrl.create({
      message: '¿Está seguro de eliminar este vehículo?',
      position: 'bottom',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await firstValueFrom(this.vehiculoService.deleteVehicle(id));
              this.vehiculos = this.vehiculos.filter(v => v.id !== id);
              this.aplicarFiltros();
              const successToast = await this.toastCtrl.create({
                message: 'Vehículo eliminado correctamente',
                duration: 2000,
                position: 'bottom'
              });
              await successToast.present();
            } catch (error) {
              console.error('Error al eliminar vehículo:', error);
              const errorToast = await this.toastCtrl.create({
                message: 'Error al eliminar el vehículo',
                duration: 2000,
                position: 'bottom'
              });
              await errorToast.present();
            }
          }
        }
      ]
    });
    await toast.present();
  }

  onDateChange(date: string) {
    this.selectedDate = date;
    this.aplicarFiltros();
  }
}
