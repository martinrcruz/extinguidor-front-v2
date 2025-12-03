import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { RutasService } from 'src/app/services/rutas.service';
import { UserService } from 'src/app/services/user.service';
import { VehiculosService } from 'src/app/services/vehiculos.service';
import { CustomerService } from 'src/app/services/customer.service';
import { MaterialesService } from 'src/app/services/materiales.service';
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
  listaMateriales: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _usuarios: UserService,
    private _rutas: RutasService,
    private _vehiculos: VehiculosService,
    private _clientes: CustomerService,
    private _materiales: MaterialesService
  ) { }


  ngOnInit() {
    this.initForm();
    // Cargo catálogos en paralelo
    Promise.all([this.cargarListas(), this.loadUsers(), this.loadMateriales()]).then(() => {
      console.log('Catálogos cargados:', {
        rutasN: this.listaRutaN.length,
        vehicles: this.listaVehicles.length,
        users: this.users.length,
        materiales: this.listaMateriales.length
      });
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

  async loadMateriales() {
    try {
      const materiales = await this._materiales.getMaterials().toPromise();
      this.listaMateriales = materiales || [];
    } catch (error) {
      console.error('Error al cargar materiales:', error);
      this.listaMateriales = [];
    }
  }

  // Cargar listas para rutas, vehículos y clientes
  async cargarListas() {
    try {
      // getRutasN() devuelve directamente un array
      const rutasN = await this._rutas.getRutasN().toPromise();
      this.listaRutaN = rutasN || [];
      console.log('RutasN cargadas:', this.listaRutaN.length);
    } catch (error) {
      console.error('Error al cargar RutasN:', error);
      this.listaRutaN = [];
    }

    try {
      // getVehicles() devuelve directamente un array de vehículos
      const vehicles = await this._vehiculos.getVehicles().toPromise();
      this.listaVehicles = vehicles || [];
      console.log('Vehículos cargados:', this.listaVehicles.length);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      this.listaVehicles = [];
    }

    const cReq = await this._clientes.getCustomers();
    cReq.subscribe((res: any) => {
      console.log('Clientes recibidos:', res);
      if (res) {
        this.listaClientes = res.customers || [];
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

  // Helper para normalizar el ID para que coincida con el valor del selector
  private normalizeId(id: any, lista: any[]): any {
    if (!id) return '';
    // Buscar en la lista para ver qué tipo de valor tiene el selector
    const item = lista.find(item => (item.id || item._id) == id);
    if (item) {
      // Usar el mismo tipo de valor que tiene el selector
      return item.id || item._id;
    }
    // Si no se encuentra, convertir a número si es posible
    return typeof id === 'number' ? id : (id ? Number(id) : '');
  }

  async cargarRuta(id: string) {
    try {
      const ruta = await this._rutas.getRutaById(id).toPromise();
      if (!ruta) return;

      console.log('Ruta cargada:', ruta);
      console.log('Lista RutasN:', this.listaRutaN.length);
      console.log('Lista Vehículos:', this.listaVehicles.length);
      console.log('Lista Usuarios:', this.users.length);
      console.log('Lista Materiales:', this.listaMateriales.length);

      // El servicio devuelve directamente el RouteResponse
      // Mapear los IDs correctamente para el formulario
      // Normalizar para que coincidan exactamente con los valores de los selectores
      const rutaNId = this.normalizeId(ruta.name?.id, this.listaRutaN);
      const vehicleId = this.normalizeId(ruta.vehicle?.id, this.listaVehicles);
      const encargadoId = this.normalizeId(ruta.encargado?.id, this.users);
      
      const userIds = Array.isArray(ruta.users) 
        ? ruta.users
            .map((u: any) => this.normalizeId(u.id, this.users))
            .filter((id: any) => id !== '' && id !== null && id !== undefined)
        : [];
      
      const materialIds = Array.isArray(ruta.herramientas) 
        ? ruta.herramientas
            .map((h: any) => this.normalizeId(h.id, this.listaMateriales))
            .filter((id: any) => id !== '' && id !== null && id !== undefined)
        : [];

      console.log('Valores mapeados:', {
        rutaNId,
        vehicleId,
        encargadoId,
        userIds,
        materialIds
      });

      this.rutaForm.patchValue({
        name: rutaNId,
        date: ruta.date ? isoDateOnly(ruta.date) : '',
        state: ruta.state || 'Pendiente',
        vehicle: vehicleId,
        users: userIds,
        comentarios: ruta.comentarios ?? '',
        encargado: encargadoId,
        herramientas: materialIds,
      });

      console.log('Formulario después de patchValue:', this.rutaForm.value);
    } catch (err) {
      console.error('Error al cargar ruta:', err);
    }
  }

  // Guardar ruta (crear o actualizar)
   async onSave() {
    if (this.rutaForm.invalid) {
      console.error('Formulario inválido:', this.rutaForm.errors);
      return;
    }

    const formValue = this.rutaForm.value;
    
    // Transformar los datos al formato que espera el backend
    const body: any = {
      encargadoId: this.parseToLong(formValue.encargado),
      rutaNId: this.parseToLong(formValue.name),
      date: formValue.date ? isoDateOnly(formValue.date) : null,
      state: formValue.state || 'Pendiente',
      vehicleId: formValue.vehicle ? this.parseToLong(formValue.vehicle) : null,
      userIds: Array.isArray(formValue.users) 
        ? formValue.users.map((id: any) => this.parseToLong(id)).filter((id: any) => id !== null)
        : [],
      materialIds: Array.isArray(formValue.herramientas)
        ? formValue.herramientas.map((id: any) => this.parseToLong(id)).filter((id: any) => id !== null)
        : [],
      comentarios: formValue.comentarios || null,
    };

    if (!body.encargadoId || !body.rutaNId) {
      console.error('Faltan campos obligatorios:', body);
      return;
    }

    try {
      if (!this.isEdit) {
        const ruta = await this._rutas.createRuta(body).toPromise();
        if (ruta) {
          console.log('Ruta creada exitosamente:', ruta);
          this.navCtrl.navigateRoot('/rutas');
        }
      } else {
        const ruta = await this._rutas.updateRuta({ ...body, id: this.rutaId, _id: this.rutaId }).toPromise();
        if (ruta) {
          console.log('Ruta actualizada exitosamente:', ruta);
          this.navCtrl.navigateRoot('/rutas');
        }
      }
    } catch (e: any) {
      console.error('Error al guardar:', e);
      // Mostrar mensaje de error al usuario si es posible
      if (e?.message) {
        alert('Error: ' + e.message);
      }
    }
  }

  // Helper para convertir string a Long (número)
  private parseToLong(value: any): number | null {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const parsed = parseInt(value.toString(), 10);
    return isNaN(parsed) ? null : parsed;
  }

  cancel() {
    this.navCtrl.back();
  }
}
