import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { ContratoService } from 'src/app/services/contrato.service';
import { ClientesService, Cliente } from 'src/app/services/clientes.service';
import { isoDateOnly } from 'src/app/shared/utils/date.utils';

@Component({
  selector: 'app-form-contrato',
  standalone: false,
  templateUrl: './form-contrato.component.html',
  styleUrls: ['./form-contrato.component.scss'],
})
export class FormContratoComponent implements OnInit {

  contractForm!: FormGroup;
  isEdit = false;
  contractId: string | null = null;
  clientes: Cliente[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _contrato: ContratoService,
    private clientesService: ClientesService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.initForm();
    // Cargar clientes primero, luego verificar si es edición
    this.loadClientes().then(() => {
      this.contractId = this.route.snapshot.paramMap.get('id');
      if (this.contractId) {
        this.isEdit = true;
        this.cargarContrato(this.contractId);
      }
    });
  }

  initForm() {
    this.contractForm = this.fb.group({
      code: ['', Validators.required],
      customerId: ['', Validators.required],
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      type: ['F'],    // F, E, R, C ...
      averageTime: [0],
      delegation: [''],
      revisionFrequency: [''],
      address: [''],
      zone: [''],     // zone _id
      total: [0]
    });
  }

  cargarContrato(id: string) {
    try {
      this._contrato.getContractById(id).subscribe({
        next: (contract: any) => {
          console.log('Contrato cargado:', contract);
          if (contract) {
            // El servicio devuelve directamente el contrato
            this.contractForm.patchValue({
              code: contract.code,
              customerId: contract.customerId?._id || contract.customerId || contract.customer?._id || contract.customer,
              name: contract.name,
              startDate: contract.startDate ? isoDateOnly(contract.startDate) : '',
              endDate: contract.endDate ? isoDateOnly(contract.endDate) : '',
              type: contract.type,
              averageTime: contract.averageTime,
              delegation: contract.delegation,
              revisionFrequency: contract.revisionFrequency,
              address: contract.address,
              zone: contract.zone?._id || contract.zone,
              total: contract.total
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar contrato:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar contrato:', error);
    }
  }

  async guardar() {
    if (this.contractForm.invalid) return;

    const data = this.contractForm.value;
    try {
      if (!this.isEdit) {
        // Crear contrato
        const req = await this._contrato.createContract(data);
        req.subscribe((resp: any) => {
          // Cambiado de '/contracts' a '/contratos'
          this.navCtrl.navigateRoot('/contratos');
        });
      } else {
        // Editar contrato
        data._id = this.contractId;
        const req = await this._contrato.updateContract(this.contractId as string, data);
        req.subscribe((resp: any) => {
          // Cambiado de '/contracts' a '/contratos'
          this.navCtrl.navigateRoot('/contratos');
        });
      }
    } catch (error) {
      console.error('Error al guardar contrato:', error);
    }
  }

  cancel() {
    // Cambiado de '/contracts' a '/contratos'
    this.navCtrl.navigateBack('/contratos');
  }

  async loadClientes(): Promise<void> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.clientesService.getCustomers().subscribe({
        next: (response: any) => {
          if (response && response.ok && response.data) {
            this.clientes = response.data.customers || [];
          } else {
            this.clientes = [];
          }
          this.loading = false;
          resolve();
        },
        error: (error: any) => {
          console.error('Error al cargar clientes', error);
          this.clientes = [];
          this.loading = false;
          reject(error);
        }
      });
    });
  }

  onClientSelected(client: any) {
    console.log('Cliente seleccionado:', client);
    this.contractForm.get('customerId')?.setValue(client._id);
    this.contractForm.get('customerId')?.markAsDirty();
  }
}
