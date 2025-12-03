import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FacturacionService } from 'src/app/services/facturacion.service';
import { RutasService } from 'src/app/services/rutas.service';
import { PartesService } from 'src/app/services/partes.service';

@Component({
  selector: 'app-form-facturacion',
  standalone: false,
  templateUrl: './form-facturacion.component.html',
  styleUrls: ['./form-facturacion.component.scss']
})
export class FormFacturacionComponent implements OnInit {

  facturacionForm!: FormGroup;
  isEdit = false;
  facturacionId: string | null = null;

  // Listas para selectores
  rutasDisponibles: any[] = [];
  partesDisponibles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _facturacion: FacturacionService,
    private _rutas: RutasService,
    private _partes: PartesService
  ) {}

  ngOnInit() {
    this.initForm();
    // Cargar rutas y partes primero, luego verificar si es edición
    this.cargarRutasYPartes().then(() => {
      this.route.paramMap.subscribe(params => {
        this.facturacionId = params.get('id');
        if (this.facturacionId) {
          this.isEdit = true;
          this.cargarFacturacion(this.facturacionId);
        }
      });
    });
  }

  initForm() {
    this.facturacionForm = this.fb.group({
      facturacion:  [0, Validators.required],
      ruta:         ['', Validators.required],
      parte:        ['', Validators.required]
    });
  }

  async cargarRutasYPartes(): Promise<void> {
    try {
      // Cargar rutas y partes en paralelo
      const rutasPromise = new Promise<void>((resolve) => {
        this._rutas.getRutas().subscribe({
          next: (rutas: any[]) => {
            this.rutasDisponibles = Array.isArray(rutas) ? rutas : [];
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar rutas:', error);
            this.rutasDisponibles = [];
            resolve();
          }
        });
      });

      const partesPromise = new Promise<void>((resolve) => {
        this._partes.getPartes().subscribe({
          next: (res: any) => {
            console.log('Partes cargadas:', res);
            if (res.partes && Array.isArray(res.partes)) {
              this.partesDisponibles = res.partes;
            } else if (res.data?.partes && Array.isArray(res.data.partes)) {
              this.partesDisponibles = res.data.partes;
            } else {
              this.partesDisponibles = [];
            }
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar partes:', error);
            this.partesDisponibles = [];
            resolve();
          }
        });
      });

      await Promise.all([rutasPromise, partesPromise]);
    } catch (error) {
      console.error('Error al cargar rutas y partes:', error);
    }
  }

 async cargarFacturacion(id: string) {
  const req = this._facturacion.getFacturacionById(id);
  req.subscribe({
    next: (res: any) => {
      console.log('Facturación cargada:', res);
      if (!(res?.ok && res.data?.facturacion)) return;

      const f = res.data.facturacion;
      const rutaId = f.ruta?._id || f.ruta?.id?.toString() || f.ruta;
      const parteId = f.parte?._id || f.parte?.id?.toString() || f.parte;

      /* ▸ Garantizar que la ruta y el parte existan en sus arrays
         (por si aún no se han cargado desde el backend) */
      if (rutaId && !this.rutasDisponibles.some(r => (r._id || r.id?.toString()) === rutaId)) {
        this.rutasDisponibles.push(f.ruta);
      }
      if (parteId && !this.partesDisponibles.some(p => (p._id || p.id?.toString()) === parteId)) {
        this.partesDisponibles.push(f.parte);
      }

      /* ▸ Cargar datos en el formulario */
      this.facturacionForm.patchValue({
        facturacion: f.facturacion,
        ruta:        rutaId,   // solo el _id
        parte:       parteId   // solo el _id
      });
    },
    error: (error) => {
      console.error('Error al cargar facturación:', error);
    }
  });
}

async guardar() {
  if (this.facturacionForm.invalid) return;

  try {
    const data = this.facturacionForm.value;

    if (!this.isEdit) {
      const req = await this._facturacion.createFacturacion(data);
      req.subscribe(resp => {
        if (resp.ok) this.navCtrl.navigateRoot('/facturacion');
      });
    } else if (this.facturacionId) {
      const req = await this._facturacion.updateFacturacion(this.facturacionId, data);
      req.subscribe(resp => {
        if (resp.ok) this.navCtrl.navigateRoot('/facturacion');
      });
    }
  } catch (error) {
    console.error('Error guardando facturación:', error);
  }
}
}
