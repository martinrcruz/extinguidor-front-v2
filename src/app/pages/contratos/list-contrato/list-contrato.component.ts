import { Component, OnInit } from '@angular/core';
import { isoDateOnly } from 'src/app/shared/utils/date.utils';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { ContratoService } from '../../../services/contrato.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-list-contrato',
  standalone: false,
  templateUrl: './list-contrato.component.html',
  styleUrls: ['./list-contrato.component.scss'],
})
export class ListContratoComponent implements OnInit {
  contracts: any[] = [];
  filteredContracts: any[] = [];
  errorMessage: string = '';
  searchTerm: string = '';
  selectedType: string = '';
  selectedDate: string = '';

  constructor(
    private contratoService: ContratoService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargarContratos();
  }

  async cargarContratos() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando contratos...'
    });
    await loading.present();

    try {
      const response = await firstValueFrom(this.contratoService.getContracts());
      this.contracts = response || [];
      this.filteredContracts = [...this.contracts];
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      this.errorMessage = 'Error al cargar los contratos. Por favor, intente nuevamente.';
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
    this.filteredContracts = this.contracts.filter(contrato => {
      const matchesSearch = contrato.name?.toLowerCase().includes(this.searchTerm) ||
                          contrato.code?.toLowerCase().includes(this.searchTerm) ||
                          contrato.customerId?.toLowerCase().includes(this.searchTerm);
      
      const matchesType = !this.selectedType || contrato.type === this.selectedType;
      
      const matchesDate = !this.selectedDate || 
                         isoDateOnly(contrato.startDate) === this.selectedDate;
      
      return matchesSearch && matchesType && matchesDate;
    });
  }

  nuevoContrato() {
    this.router.navigate(['/contratos/create']);
  }

  editarContrato(id: string) {
    this.router.navigate(['/contratos/edit', id]);
  }

  async eliminarContrato(id: string) {
    const toast = await this.toastCtrl.create({
      message: '¿Está seguro de eliminar este contrato?',
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
              await firstValueFrom(this.contratoService.deleteContract(id));
              this.contracts = this.contracts.filter(c => c._id !== id);
              this.aplicarFiltros();
              const successToast = await this.toastCtrl.create({
                message: 'Contrato eliminado correctamente',
                duration: 2000,
                position: 'bottom'
              });
              await successToast.present();
            } catch (error) {
              console.error('Error al eliminar contrato:', error);
              const errorToast = await this.toastCtrl.create({
                message: 'Error al eliminar el contrato',
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
