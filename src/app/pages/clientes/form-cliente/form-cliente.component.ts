import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { ClientesService } from '../../../services/clientes.service';
import { ZonasService } from '../../../services/zonas.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-cliente',
  standalone: false,
  templateUrl: './form-cliente.component.html',
  styleUrls: ['./form-cliente.component.scss'],
})
export class FormClienteComponent implements OnInit {
  clienteForm!: FormGroup;
  isEdit = false;
  customerId: string | null = null;
  zonas: any[] = [];
  selectedFile: File | null = null;
  previewImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private zonasService: ZonasService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.initForm();
    // Cargar zonas primero, luego verificar si es edición
    this.cargarZonas().then(() => {
      this.route.paramMap.subscribe(params => {
        this.customerId = params.get('id');
        if (this.customerId) {
          this.isEdit = true;
          this.cargarCliente(this.customerId);
        }
      });
    });
  }

  initForm() {
    this.clienteForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      nifCif: ['', Validators.required],
      phone: [''],
      address: [''],
      zone: [''],
      code: [''],
      contactName: [''],
      MI: [0],
      tipo: ['Normal']
    });
  }

  async cargarZonas(): Promise<void> {
    try {
      const response = await firstValueFrom(this.zonasService.getZones());
      if (response && response.ok && response.data) {
        this.zonas = response.data.zones || [];
      } else {
        this.zonas = [];
      }
    } catch (error) {
      console.error('Error al cargar zonas:', error);
      this.zonas = [];
    }
  }

  async cargarCliente(id: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando cliente...'
    });
    await loading.present();

    try {
      const response = await firstValueFrom(this.clientesService.getCustomerById(id));
      console.log('Cliente cargado:', response);
      if (response && response.ok && response.data) {
        const customer = response.data.customer || response.data;
        this.clienteForm.patchValue({
          name: customer.name,
          email: customer.email,
          nifCif: customer.nifCif,
          phone: customer.phone,
          address: customer.address,
          zone: customer.zone?._id || customer.zone?.id?.toString() || customer.zone || '',
          code: customer.code,
          contactName: customer.contactName,
          MI: customer.MI || customer.mi,
          tipo: customer.tipo || 'Normal'
        });
        this.previewImage = customer.photo || null;
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al cargar el cliente',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.previewImage = null;
  }

  async guardar() {
    if (this.clienteForm.invalid) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando cliente...'
    });
    await loading.present();

    try {

      if (this.selectedFile) {
        this.clienteForm.patchValue({
          photo: this.selectedFile
        });
      }

      console.log(this.clienteForm.value)

      if (this.isEdit && this.customerId) {
        await firstValueFrom(this.clientesService.updateCustomer(this.customerId, this.clienteForm.value));
      } else {
        await firstValueFrom(this.clientesService.createCustomer(this.clienteForm.value));
      }

      const toast = await this.toastCtrl.create({
        message: `Cliente ${this.isEdit ? 'actualizado' : 'creado'} correctamente`,
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();

      this.router.navigate(['/clientes']);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al guardar el cliente',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }
}
