import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { AlertaService } from 'src/app/services/alerta.service';
import { Alerta } from 'src/app/models/alerta.model';

@Component({
  selector: 'app-list-alerta',
  standalone: false,
  templateUrl: './list-alerta.component.html',
  styleUrls: ['./list-alerta.component.scss'],
})
export class ListAlertaComponent implements OnInit {
  alertas: any[] = [];
  loading = false;

  constructor(
    private _alerta: AlertaService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  async cargarAlertas() {
    this.loading = true;
    this._alerta.getAlertas().subscribe({
      next: (alertas: Alerta[]) => {
        this.alertas = alertas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar alertas:', error);
        this.loading = false;
        this.showToast('Error al cargar alertas', 'danger');
      }
    });
  }

  cambiarEstado(alerta: Alerta, nuevoEstado: string) {
    this._alerta.updateAlerta(alerta._id, { state: nuevoEstado as 'Pendiente' | 'Cerrado' }).subscribe({
      next: (alertaActualizada: Alerta) => {
        const index = this.alertas.findIndex(a => a._id === alertaActualizada._id);
        if (index !== -1) {
          this.alertas[index] = alertaActualizada;
        }
        this.showToast('Alerta actualizada', 'success');
      },
      error: (error) => {
        console.error('Error al actualizar alerta:', error);
        this.showToast('Error al actualizar alerta', 'danger');
      }
    });
  }

  async eliminarAlerta(alerta: Alerta) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Está seguro de que desea eliminar esta alerta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this._alerta.deleteAlerta(alerta._id).subscribe({
              next: () => {
                this.alertas = this.alertas.filter(a => a._id !== alerta._id);
                this.showToast('Alerta eliminada', 'success');
              },
              error: (error) => {
                console.error('Error al eliminar alerta:', error);
                this.showToast('Error al eliminar alerta', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  crearAlerta() {
    this.router.navigate(['/alertas/create']);
  }

  async doRefresh(event: any) {
    await this.cargarAlertas();
    event.target.complete();
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

  getPriorityColor(priority: string): string {
    switch(priority?.toLowerCase()) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baja': return 'success';
      default: return 'medium';
    }
  }

  getStateColor(state: string): string {
    return state === 'Pendiente' ? 'warning' : 'success';
  }
}
