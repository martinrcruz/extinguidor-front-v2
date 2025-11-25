import { Component, OnInit } from '@angular/core';
import { formatDateLocal } from 'src/app/shared/utils/date.utils';
import { SharedModule } from 'src/app/shared/shared.module';
import { FacturacionService, Facturacion } from '../../../services/facturacion.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-list-facturacion',
  templateUrl: './list-facturacion.component.html',
  styleUrls: ['./list-facturacion.component.scss'],
  standalone: false
})
export class ListFacturacionComponent implements OnInit {
  facturaciones: Facturacion[] = [];
  totalFacturado: number = 0;
  error: string = '';

  constructor(
    private facturacionService: FacturacionService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.cargarFacturaciones();
  }

  ionViewDidEnter(){
   this.cargarFacturaciones();
  }

  async cargarFacturaciones() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando facturaciones...'
    });
    await loading.present();

    try {
      const response = await firstValueFrom(this.facturacionService.getFacturacion());
      console.log(response)
      if (response && response.ok && response.data) {
        this.facturaciones = response.data.facturacion;
        this.calcularTotal();
      } else {
        this.facturaciones = [];
        this.totalFacturado = 0;
      }
    } catch (error) {
      console.error('Error al cargar facturaciones:', error);
      this.error = 'Error al cargar las facturaciones';
      const toast = await this.toastCtrl.create({
        message: this.error,
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  calcularTotal() {
    this.totalFacturado = this.facturaciones.reduce((total, fact) => {
      return total + fact.facturacion;
    }, 0);
  }

  formatDate(date: string): string {
    return formatDateLocal(date);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pagada':
        return 'estado-pagada';
      case 'Pendiente':
        return 'estado-pendiente';
      case 'Anulada':
        return 'estado-anulada';
      default:
        return '';
    }
  }

  async eliminarFactura(id: string) {
    const toast = await this.toastCtrl.create({
      message: '¿Está seguro de eliminar esta facturación?',
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
              const response = await firstValueFrom(this.facturacionService.deleteFacturacion(id));
              if (response && response.ok) {
                this.facturaciones = this.facturaciones.filter(f => f._id !== id);
                this.calcularTotal();
                const successToast = await this.toastCtrl.create({
                  message: 'Facturación eliminada correctamente',
                  duration: 2000,
                  position: 'bottom',
                  color: 'success'
                });
                await successToast.present();
              } else {
                throw new Error(response?.error || 'Error al eliminar la facturación');
              }
            } catch (error) {
              console.error('Error al eliminar facturación:', error);
              const errorToast = await this.toastCtrl.create({
                message: 'Error al eliminar la facturación',
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
} 