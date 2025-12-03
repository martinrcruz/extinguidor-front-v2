import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { ClientesService, Cliente, ClientesResponse } from '../../../services/clientes.service';
import { ZonasService, Zona, ZonasResponse } from '../../../services/zonas.service';
import { ExportService } from '../../../services/export.service';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../../../models/api-response.model';

@Component({
  selector: 'app-list-cliente',
  standalone: false,
  templateUrl: './list-cliente.component.html',
  styleUrls: ['./list-cliente.component.scss'],
})
export class ListClienteComponent implements OnInit {
  clientes: Cliente[] = [];
  filteredClientes: Cliente[] = [];
  zonas: Zona[] = [];
  errorMessage: string = '';
  searchText: string = '';
  selectedZone: string = '';
  selectedType: string = '';
  loading: boolean = false;
  
  // Paginación
  currentPage: number = 1;
  pageSize: number = 8;
  totalPages: number = 0;
  paginatedClientes: Cliente[] = [];

  constructor(
    private clientesService: ClientesService,
    private zonasService: ZonasService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private exportService: ExportService
  ) {}

  ngOnInit() {
    // Solo inicializar variables, no cargar datos aquí
    // Los datos se cargarán en ionViewDidEnter que es el hook correcto para Ionic
    this.cargarZonas(); // Las zonas solo se cargan una vez
  }


  ionViewDidEnter(){
    // Este hook se ejecuta cada vez que la página entra en vista
    // Es el lugar correcto para cargar datos en Ionic
    this.cargarClientes();
  }

  async cargarClientes() {
    this.loading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Cargando clientes...'
    });
    await loading.present();

    try {
      console.log('[ListClienteComponent] Iniciando carga de clientes...');
      const response = await firstValueFrom(this.clientesService.getCustomers());
      console.log('[ListClienteComponent] Respuesta recibida:', response);
      if (response && response.ok && response.data) {
        this.clientes = response.data.customers || [];
        console.log('[ListClienteComponent] Clientes procesados:', this.clientes.length);
        console.log('[ListClienteComponent] Primer cliente:', this.clientes[0]);
        this.filteredClientes = [...this.clientes];
        console.log('[ListClienteComponent] Clientes filtrados:', this.filteredClientes.length);
        this.currentPage = 1; // Resetear a la primera página
        this.applyPagination();
        console.log('[ListClienteComponent] Clientes paginados:', this.paginatedClientes.length);
        console.log('[ListClienteComponent] Primer cliente paginado:', this.paginatedClientes[0]);
        this.errorMessage = '';
      } else {
        console.warn('[ListClienteComponent] Respuesta inválida:', response);
        this.clientes = [];
        this.filteredClientes = [];
        this.paginatedClientes = [];
        this.errorMessage = response?.error || 'No se pudieron cargar los clientes';
      }
    } catch (error: any) {
      console.error('[ListClienteComponent] Error al cargar clientes:', error);
      console.error('[ListClienteComponent] Detalles del error:', {
        message: error?.message,
        status: error?.status,
        error: error?.error
      });
      this.errorMessage = error?.message || 'Error al cargar los clientes. Por favor, intente nuevamente.';
      this.clientes = [];
      this.filteredClientes = [];
      this.paginatedClientes = [];
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  async cargarZonas() {
    try {
      const response = await firstValueFrom(this.zonasService.getZones());
      if (response && response.ok && response.data) {
        this.zonas = response.data.zones;
      } else {
        this.zonas = [];
      }
    } catch (error) {
      console.error('Error al cargar zonas:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al cargar las zonas',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  filterCustomers() {
    this.filteredClientes = this.clientes.filter(cliente => {
      const matchesSearch = cliente.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
                          cliente.email?.toLowerCase().includes(this.searchText.toLowerCase()) ||
                          cliente.nifCif?.toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesZone = !this.selectedZone || cliente.zone?._id === this.selectedZone;
      
      const matchesType = !this.selectedType || cliente.tipo === this.selectedType;
      
      return matchesSearch && matchesZone && matchesType;
    });
    
    // Resetear a la primera página cuando se filtran los resultados
    this.currentPage = 1;
    this.applyPagination();
  }
  
  applyPagination() {
    console.log('[ListClienteComponent] applyPagination - filteredClientes.length:', this.filteredClientes.length);
    console.log('[ListClienteComponent] applyPagination - currentPage:', this.currentPage);
    console.log('[ListClienteComponent] applyPagination - pageSize:', this.pageSize);
    
    this.totalPages = Math.ceil(this.filteredClientes.length / this.pageSize);
    console.log('[ListClienteComponent] applyPagination - totalPages:', this.totalPages);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    console.log('[ListClienteComponent] applyPagination - startIndex:', startIndex, 'endIndex:', endIndex);
    
    this.paginatedClientes = this.filteredClientes.slice(startIndex, endIndex);
    console.log('[ListClienteComponent] applyPagination - paginatedClientes.length:', this.paginatedClientes.length);
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.applyPagination();
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPagination();
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPagination();
    }
  }

  nuevoCliente() {
    this.router.navigate(['/clientes/create']);
  }

  editarCliente(id: string) {
    this.router.navigate(['/clientes/edit', id]);
  }

  async eliminarCliente(id: string) {
    const toast = await this.toastCtrl.create({
      message: '¿Está seguro de eliminar este cliente?',
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
              const response = await firstValueFrom(this.clientesService.deleteCustomer(id));
              if (response && response.ok) {
                this.clientes = this.clientes.filter(c => c._id !== id);
                this.filterCustomers();
                const successToast = await this.toastCtrl.create({
                  message: 'Cliente eliminado correctamente',
                  duration: 2000,
                  position: 'bottom',
                  color: 'success'
                });
                await successToast.present();
              } else {
                throw new Error(response?.error || 'Error al eliminar el cliente');
              }
            } catch (error) {
              console.error('Error al eliminar cliente:', error);
              const errorToast = await this.toastCtrl.create({
                message: 'Error al eliminar el cliente',
                duration: 2000,
                position: 'bottom',
                color: 'danger'
              });
              await errorToast.present();
            }
          }
        }
      ]
    });
    await toast.present();
  }

  async exportarExcel() {
    const loading = await this.loadingCtrl.create({
      message: 'Exportando a Excel...'
    });
    await loading.present();

    try {
      const observable = await this.exportService.exportCustomersToExcel();
      observable.subscribe({
        next: (blob) => {
          const filename = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
          this.exportService.downloadFile(blob, filename);
          this.showToast('Archivo Excel descargado correctamente', 'success');
        },
        error: (error) => {
          console.error('Error al exportar a Excel:', error);
          this.showToast('Error al exportar a Excel', 'danger');
        },
        complete: async () => {
          await loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error:', error);
      await loading.dismiss();
      this.showToast('Error al exportar a Excel', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
