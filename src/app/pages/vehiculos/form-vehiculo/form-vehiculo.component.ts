import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { VehiculosService } from 'src/app/services/vehiculos.service';

@Component({
  selector: 'app-form-vehiculo',
  standalone: false,
  templateUrl: './form-vehiculo.component.html',
  styleUrls: ['./form-vehiculo.component.scss'],
})
export class FormVehiculoComponent  implements OnInit {

  vehicleForm!: FormGroup;
  isEdit = false;
  vehicleId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _vehiculo: VehiculosService
  ) {}

  ngOnInit() {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.vehicleId = params.get('id');
      if (this.vehicleId) {
        this.isEdit = true;
        this.cargarVehiculo(this.vehicleId);
      }
    });
  }

  initForm() {
    this.vehicleForm = this.fb.group({
      brand:    ['', Validators.required],
      modelo:   ['', Validators.required],
      matricula:['', Validators.required],
      fuel:     ['Diesel'], // Diesel, Gasolina, etc.
      type:     ['Furgon'], // Furgon, Turismo...
      photo:    ['']
    });
  }

  async cargarVehiculo(id: string) {
    try {
      const req = this._vehiculo.getVehicleById(id);
      req.subscribe({
        next: (vehicle: any) => {
          if (vehicle) {
            this.vehicleForm.patchValue({
              brand:      vehicle.brand,
              modelo:     vehicle.modelo,
              matricula:  vehicle.matricula,
              fuel:       vehicle.fuel,
              type:       vehicle.type,
              photo:      vehicle.photo
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar vehículo:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar vehículo:', error);
    }
  }

  async guardar() {
    if (this.vehicleForm.invalid) return;

    const data = this.vehicleForm.value;
    try {
      if (!this.isEdit) {
        // Crear
        const req = await this._vehiculo.createVehicle(data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/vehiculos');
        });
      } else {
        // Editar
        if (!this.vehicleId) {
          console.error('No se proporcionó el ID del vehículo');
          return;
        }
        data._id = this.vehicleId;
        const req = await this._vehiculo.updateVehicle(this.vehicleId, data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/vehiculos');
        });
      }
    } catch (error) {
      console.error('Error guardando vehículo:', error);
    }
  }

  cancelar() {
    // Volver a la lista de vehículos
    this.navCtrl.navigateBack('/vehiculos');
  }
}
