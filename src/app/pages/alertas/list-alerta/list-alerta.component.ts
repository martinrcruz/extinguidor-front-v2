import { Component, OnInit } from '@angular/core';
import { AlertaService } from 'src/app/services/alerta.service';
import { Alerta } from 'src/app/models/alerta.model';

@Component({
  selector: 'app-list-alerta',
  standalone: false,
  templateUrl: './list-alerta.component.html',
  styleUrls: ['./list-alerta.component.scss'],
})
export class ListAlertaComponent implements OnInit {
  alertas: Alerta[] = [];

  constructor(private _alerta: AlertaService) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas() {
    this._alerta.getAlertas().subscribe({
      next: (alertas: Alerta[]) => {
        this.alertas = alertas;
      },
      error: (error) => {
        console.error('Error al cargar alertas:', error);
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
      },
      error: (error) => {
        console.error('Error al actualizar alerta:', error);
      }
    });
  }
}
