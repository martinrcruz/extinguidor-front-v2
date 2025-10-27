import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Parte } from 'src/app/interfaces/parte.interface';
import { PartesService } from 'src/app/services/partes.service';

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

  constructor(
    private parteService: PartesService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarPartes();
  }

  async cargarPartes() {
    const loading = await this.loadingController.create({
      message: 'Cargando partes...'
    });
    await loading.present();

    try {
      const partesObservable = await this.parteService.getPartes();
      partesObservable.subscribe((res: any) =>
         {

        this.partes = res.partes as Parte[];
        this.aplicarFiltros();
      }, (err: any) => {
        this.error = 'Error al cargar las partes';
        console.error(err);
      });
    } finally {
      await loading.dismiss();
    }
  }

  ionViewDidEnter() {
    // Recargar partes cuando se entra en la vista
    this.cargarPartes();
  }

  filtrar(event: any) {
    const searchTerm = event.detail.value.toLowerCase();
    this.aplicarFiltros(searchTerm);
  }

  aplicarFiltros(searchTerm: string = '') {
    this.filteredPartes = this.partes.filter(parte => {
      const matchesSearch = !searchTerm || 
        parte.description.toLowerCase().includes(searchTerm) ||
        parte.customer.name.toLowerCase().includes(searchTerm) ||
        parte.ruta.name.name.toLowerCase().includes(searchTerm);

      const matchesEstado = !this.estadoFiltro || parte.state === this.estadoFiltro;
      const matchesTipo = !this.tipoFiltro || parte.type === this.tipoFiltro;

      return matchesSearch && matchesEstado && matchesTipo;
    });
  }

  nuevaParte() {
    this.router.navigate(['/partes/create']);
  }

  editarParte(id: string) {
    this.router.navigate(['/partes/edit', id]);
  }

  async eliminarParte(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Deseas eliminar esta parte?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              const deleteObservable = await this.parteService.deleteParte(id);
              deleteObservable.subscribe((res: any) => {
                if (res.ok) {
                  this.mostrarToast('Parte eliminada correctamente.');
                  this.cargarPartes(); // Recargar la lista
                } else {
                  this.mostrarToast('Error al eliminar la parte.');
                }
              }, (error: any) => {
                console.error('Error al eliminar parte:', error);
                this.mostrarToast('Error al eliminar la parte.');
              });
            } catch (error) {
              console.error('Error al eliminar parte:', error);
              this.mostrarToast('Error al eliminar la parte.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom'
    });
    toast.present();
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
      default:
        return '';
    }
  }
}
