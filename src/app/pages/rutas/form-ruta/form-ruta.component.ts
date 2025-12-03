import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { RutasService } from 'src/app/services/rutas.service';
import { UserService } from 'src/app/services/user.service';
import { VehiculosService } from 'src/app/services/vehiculos.service';
import { CustomerService } from 'src/app/services/customer.service';
import { isoDateOnly } from 'src/app/shared/utils/date.utils';

@Component({
  selector: 'app-form-ruta',
  standalone: false,
  templateUrl: './form-ruta.component.html',
  styleUrls: ['./form-ruta.component.scss'],
})
export class FormRutaComponent implements OnInit {
  rutaForm!: FormGroup;
  isEdit = false;
  rutaId: string | null = null;
  users: any[] = [];
  // clientes: any[] = [];
  listaRutaN: any[] = [];
  listaVehicles: any[] = [];
  listaClientes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _usuarios: UserService,
    private _rutas: RutasService,
    private _vehiculos: VehiculosService,
    private _clientes: CustomerService
  ) { }


  ngOnInit() {
    this.initForm();
    // Cargo catálogos en paralelo
    Promise.all([this.cargarListas(), this.loadUsers()]).then(() => {
      // cuando ya tengo catálogos, veo si es edición
      this.route.paramMap.subscribe(async (params) => {
        this.rutaId = params.get('id');
        if (this.rutaId) {
          this.isEdit = true;
          await this.cargarRuta(this.rutaId);
        }
      });
    });
  }

  async loadUsers() {
    const req = await this._usuarios.getAllUsers();
    return req
      .toPromise()
      .then((resp: any) => (this.users = resp.ok ? resp.data.users : []))
      .catch(() => (this.users = []));
  }
  // Cargar listas para rutas, vehículos y clientes
  async cargarListas() {
    const rnReq = await this._rutas.getRutasN();
    rnReq.subscribe((res: any) => {
      console.log(res)
      if (res.ok) {
        this.listaRutaN = res.rutas;
      }
    });

    const vReq = await this._vehiculos.getVehicles();
    vReq.subscribe((res: any) => {
      console.log(res)
      if (res.ok) {
        this.listaVehicles = res.data;
      }
    });

    const cReq = await this._clientes.getCustomers();
    cReq.subscribe((res: any) => {
      console.log(res)
      if (res) {
        this.listaClientes = res.customers;
      }
    });
  }

  initForm() {
    this.rutaForm = this.fb.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      state: ['Pendiente', Validators.required],
      vehicle: [''],
      users: [[]],
      // clientes: [[]],          // si no lo usas, bórralo del template también
      comentarios: [''],
      encargado: ['', Validators.required],
      herramientas: [[]],
    });
  }

  async cargarRuta(id: string) {
    const req = this._rutas.getRutaById(id);
    req.subscribe({
      next: (ruta: any) => {
        if (!ruta) return;

        // El servicio devuelve directamente el RouteResponse
        this.rutaForm.patchValue({
          name: ruta.name?.id?.toString() || ruta.name?._id || ruta.name || '',
          date: ruta.date ? isoDateOnly(ruta.date) : '',
          state: ruta.state || 'Pendiente',
          vehicle: ruta.vehicle?.id?.toString() || ruta.vehicle?._id || ruta.vehicle || '',
          users: Array.isArray(ruta.users) ? ruta.users.map((u: any) => u.id?.toString() || u._id || u) : [],
          comentarios: ruta.comentarios ?? '',
          encargado: ruta.encargado?.id?.toString() || ruta.encargado?._id || ruta.encargado || '',
          herramientas: Array.isArray(ruta.herramientas) ? ruta.herramientas.map((h: any) => h.id?.toString() || h._id || h) : [],
        });
      },
      error: (err) => console.error('Error al cargar ruta:', err),
    });
  }

  // Guardar ruta (crear o actualizar)
   async onSave() {
    if (this.rutaForm.invalid) return;

    const body = { ...this.rutaForm.value };
    if (!body.encargado) return;

    try {
      if (!this.isEdit) {
        const req = await this._rutas.createRuta(body);
        req.subscribe((r: any) => r.ok && this.navCtrl.navigateRoot('/rutas'));
      } else {
        body._id = this.rutaId;
        const req = await this._rutas.updateRuta(body);
        req.subscribe((r: any) => r.ok && this.navCtrl.navigateRoot('/rutas'));
      }
    } catch (e) {
      console.error('Error al guardar:', e);
    }
  }

  cancel() {
    this.navCtrl.back();
  }
}
