import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Parte } from 'src/app/models/parte.model';
import { PartesService } from 'src/app/services/partes.service';
import { ExportService } from 'src/app/services/export.service';

@Component({
  selector: 'app-list-parte',
  standalone: false,
  templateUrl: './list-parte.component.html',
  styleUrls: ['./list-parte.component.scss']
})
export class ListParteComponent implements OnInit {
  partes: Parte[] = [];
  filteredPartes: Parte[] = [];
  error: string = '';
  estadoFiltro: string = '';
  tipoFiltro: string = '';
  isLoading: boolean = false;
  
  // Variables de paginación
  currentPage: number = 0;
  totalPages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  constructor(
    private parteService: PartesService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private exportService: ExportService
  ) {}

  ngOnInit() {
    // Solo inicializar variables, no cargar datos aquí
    // Los datos se cargarán en ionViewDidEnter que es el hook correcto para Ionic
  }

  async cargarPartes(page: number = 0) {
    this.isLoading = true;
    this.currentPage = page;
    
    const loading = await this.loadingController.create({
      message: 'Cargando partes...'
    });
    await loading.present();

    try {
      const partesObservable = await this.parteService.getPartes(page, this.itemsPerPage);
      partesObservable.subscribe({
        next: (res: any) => {
          // Convertir ParteResponse[] a Parte[]
          this.partes = (res.partes || []).map((p: any) => this.parteService.convertParteResponseToParte(p));
          
          // Actualizar información de paginación
          this.totalPages = res.totalPages || 0;
          this.totalItems = res.totalItems || 0;
          
          // Aplicar filtros locales (si hay filtros activos, se aplican sobre los datos cargados)
          this.aplicarFiltros();
          this.isLoading = false;
        },
        error: (err: any) => {
          this.error = 'Error al cargar las partes';
          console.error(err);
          this.isLoading = false;
          this.showToast('Error al cargar las partes', 'danger');
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
      this.showToast('Error al cargar las partes', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  ionViewDidEnter() {
    // Este hook se ejecuta cada vez que la página entra en vista
    // Es el lugar correcto para cargar datos en Ionic
    this.cargarPartes();
  }

  filtrar(event: any) {
    const searchTerm = event.detail.value.toLowerCase();
    // Si hay un término de búsqueda, resetear a la primera página
    // Nota: Los filtros se aplican localmente sobre los datos de la página actual
    this.aplicarFiltros(searchTerm);
  }

  aplicarFiltros(searchTerm: string = '') {
    this.filteredPartes = this.partes.filter(parte => {
      // Acceso seguro a propiedades
      const customerName = typeof parte.customer === 'object' ? parte.customer?.name : '';
      const rutaObj = typeof parte.ruta === 'object' ? parte.ruta : null;
      const rutaName = rutaObj && typeof rutaObj.name === 'string' ? rutaObj.name : '';
      
      const matchesSearch = !searchTerm || 
        parte.description?.toLowerCase().includes(searchTerm) ||
        parte.title?.toLowerCase().includes(searchTerm) ||
        customerName?.toLowerCase().includes(searchTerm) ||
        rutaName?.toLowerCase().includes(searchTerm);

      const matchesEstado = !this.estadoFiltro || parte.state === this.estadoFiltro;
      const matchesTipo = !this.tipoFiltro || parte.type === this.tipoFiltro;

      return matchesSearch && matchesEstado && matchesTipo;
    });
  }

  onFiltroChange() {
    // Cuando cambia un filtro, recargar desde la primera página
    this.cargarPartes(0);
  }

  nuevaParte() {
    this.router.navigate(['/partes/create']);
  }

  editarParte(id: string | number | undefined) {
    if (!id) return;
    this.router.navigate(['/partes/edit', id]);
  }

  async eliminarParte(id: string | number | undefined) {
    if (!id) return;
    
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta parte?',
      buttons: [
        { 
          text: 'Cancelar', 
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando parte...'
            });
            await loading.present();
            
            try {
              const deleteObservable = await this.parteService.deleteParte(String(id));
              deleteObservable.subscribe({
                next: (res: any) => {
                  if (res.ok) {
                    this.showToast('Parte eliminada correctamente.', 'success');
                    // Si era el último elemento de la página y no estamos en la primera página,
                    // ir a la página anterior. De lo contrario, recargar la página actual.
                    let pageToLoad = this.currentPage;
                    if (this.partes.length === 1 && this.currentPage > 0) {
                      pageToLoad = this.currentPage - 1;
                    }
                    this.cargarPartes(pageToLoad);
                  } else {
                    this.showToast('Error al eliminar la parte.', 'danger');
                  }
                },
                error: (error: any) => {
                  console.error('Error al eliminar parte:', error);
                  this.showToast('Error al eliminar la parte.', 'danger');
                },
                complete: async () => {
                  await loading.dismiss();
                }
              });
            } catch (error) {
              console.error('Error al eliminar parte:', error);
              this.showToast('Error al eliminar la parte.', 'danger');
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getTipoParteClass(tipo: string): string {
    switch (tipo) {
      case 'Mantenimiento':
        return 'tipo-mantenimiento';
      case 'Correctivo':
        return 'tipo-correctivo';
      case 'Visitas':
        return 'tipo-visitas';
      case 'Obra':
        return 'tipo-obra';
      default:
        return '';
    }
  }

  stateColor(state: string): string {
    switch (state) {
      case 'Pendiente':
        return 'state-pendiente';
      case 'EnProceso':
        return 'state-proceso';
      case 'Finalizado':
        return 'state-finalizado';
      case 'Cancelado':
        return 'state-cancelado';
      default:
        return '';
    }
  }

  async exportarExcel() {
    const loading = await this.loadingController.create({
      message: 'Exportando a Excel...'
    });
    await loading.present();

    try {
      const observable = await this.exportService.exportPartesToExcel();
      observable.subscribe({
        next: (blob) => {
          const filename = `partes_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  async exportarPDF() {
    const loading = await this.loadingController.create({
      message: 'Exportando a PDF...'
    });
    await loading.present();

    try {
      const observable = await this.exportService.exportPartesToPDF();
      observable.subscribe({
        next: (blob) => {
          const filename = `partes_${new Date().toISOString().split('T')[0]}.pdf`;
          this.exportService.downloadFile(blob, filename);
          this.showToast('Archivo PDF descargado correctamente', 'success');
        },
        error: (error) => {
          console.error('Error al exportar a PDF:', error);
          this.showToast('Error al exportar a PDF', 'danger');
        },
        complete: async () => {
          await loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error:', error);
      await loading.dismiss();
      this.showToast('Error al exportar a PDF', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
  
  getCustomerName(parte: Parte): string {
    return typeof parte.customer === 'object' ? parte.customer?.name || 'Sin cliente' : 'Sin cliente';
  }
  
  getRutaName(parte: Parte): string {
    const rutaObj = typeof parte.ruta === 'object' ? parte.ruta : null;
    if (!rutaObj) return 'No asignada';
    return typeof rutaObj.name === 'string' ? rutaObj.name : (rutaObj.name?.name || 'No asignada');
  }

  // Métodos de paginación
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.cargarPartes(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.cargarPartes(this.currentPage - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.cargarPartes(page);
    }
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  get hasPrevPage(): boolean {
    return this.currentPage > 0;
  }

  get paginationInfo(): string {
    if (this.totalItems === 0) return 'No hay partes';
    const start = (this.currentPage * this.itemsPerPage) + 1;
    const end = Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems);
    return `${start} - ${end} de ${this.totalItems}`;
  }
}
