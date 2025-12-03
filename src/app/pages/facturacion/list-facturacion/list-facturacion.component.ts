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
    // No cargar aquí, se cargará en ionViewDidEnter
  }

  async ionViewDidEnter(){
    await this.cargarFacturaciones();
  }

  /**
   * Normaliza el ID de una facturación (convierte id a _id como string)
   */
  private normalizarId(facturacion: any): string {
    if (!facturacion) return '';
    if (facturacion._id) return facturacion._id.toString();
    if (facturacion.id !== undefined && facturacion.id !== null) return facturacion.id.toString();
    return '';
  }

  /**
   * Normaliza una facturación para asegurar que tenga _id
   */
  private normalizarFacturacion(facturacion: any): any {
    if (!facturacion) return facturacion;
    const id = this.normalizarId(facturacion);
    return {
      ...facturacion,
      _id: id
    };
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
        // Normalizar las facturaciones para asegurar que tengan _id
        const facturacionesRaw = response.data.facturacion || [];
        this.facturaciones = facturacionesRaw.map((f: any) => this.normalizarFacturacion(f));
        this.calcularTotal();
        this.error = ''; // Limpiar error si la carga fue exitosa
      } else {
        this.facturaciones = [];
        this.totalFacturado = 0;
        // Solo mostrar error si realmente no hay datos
        if (!response || !response.ok) {
          this.error = 'Error al cargar las facturaciones';
        }
      }
    } catch (error) {
      console.error('Error al cargar facturaciones:', error);
      // Solo mostrar error si no hay datos cargados
      if (this.facturaciones.length === 0) {
        this.error = 'Error al cargar las facturaciones';
        const toast = await this.toastCtrl.create({
          message: this.error,
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
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

  /**
   * Obtiene el nombre de la ruta manejando diferentes estructuras
   */
  getRutaName(ruta: any): string {
    if (!ruta) return '';
    // El backend puede devolver name como string directo o como objeto anidado
    if (typeof ruta.name === 'string') {
      return ruta.name;
    }
    if (ruta.name && ruta.name.name) {
      return ruta.name.name;
    }
    return '';
  }

  /**
   * Obtiene la descripción del parte manejando diferentes estructuras
   */
  getParteDescription(parte: any): string {
    if (!parte) return '';
    // El backend devuelve description y title
    if (parte.description) {
      return parte.description;
    }
    if (parte.title) {
      return parte.title;
    }
    return '';
  }

  /**
   * Obtiene el ID de una facturación de forma segura
   */
  getFacturacionId(facturacion: any): string {
    return this.normalizarId(facturacion);
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

  async eliminarFactura(id: string | undefined) {
    // Asegurar que el ID sea válido
    if (!id) {
      console.error('Error: ID de facturación no válido');
      return;
    }

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
                this.facturaciones = this.facturaciones.filter(f => {
                  const factId = this.normalizarId(f);
                  return factId !== id;
                });
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