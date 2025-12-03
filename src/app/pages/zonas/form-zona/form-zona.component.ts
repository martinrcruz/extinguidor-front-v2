import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ZipcodesService } from 'src/app/services/zipcode.service';
import { ZonasService } from 'src/app/services/zonas.service';
@Component({
  selector: 'app-form-zona',
  standalone: false,
  templateUrl: './form-zona.component.html',
  styleUrls: ['./form-zona.component.scss'],
})
export class FormZonaComponent implements OnInit {

  zonaForm!: FormGroup;
  isEdit = false;
  zonaId: string | null = null;
  zipcodesDisponibles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private _zona: ZonasService,
    private _zipcodes: ZipcodesService

  ) { }

  ngOnInit() {
    this.initForm();
    // Cargar zipcodes primero, luego verificar si es edición
    this.loadZipcodes().then(() => {
      this.route.paramMap.subscribe(params => {
        this.zonaId = params.get('id');
        if (this.zonaId) {
          this.isEdit = true;
          this.cargarZona(this.zonaId);
        }
      });
    });
  }

  initForm() {
    this.zonaForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      codezip: [''] // ID de Zipcode (opcional)
    });
  }

  async loadZipcodes(): Promise<void> {
    try {
      const res = await firstValueFrom(this._zipcodes.getZipcodes());
      if (res.ok && res.data) {
        this.zipcodesDisponibles = res.data.zipcodes || [];
      } else {
        this.zipcodesDisponibles = [];
      }
    } catch (error) {
      console.error('Error al cargar zipcodes:', error);
      this.zipcodesDisponibles = [];
    }
  }

  async cargarZona(id: string) {
    try {
      const req = this._zona.getZoneById(id);
      req.subscribe({
        next: (res: any) => {
          if (res.ok && res.data) {
            const z = res.data.zone || res.data;
            // Asegurar que el zipcode esté en la lista
            if (z.codezip) {
              const codezipId = typeof z.codezip === 'object' ? (z.codezip._id || z.codezip.id?.toString()) : z.codezip;
              if (codezipId && !this.zipcodesDisponibles.some(c => c._id === codezipId || c.id?.toString() === codezipId)) {
                this.zipcodesDisponibles.push({ _id: codezipId, codezip: codezipId });
              }
            }

            this.zonaForm.patchValue({
              name: z.name,
              code: z.code,
              codezip: typeof z.codezip === 'object' ? (z.codezip._id || z.codezip.id?.toString()) : (z.codezip || '')
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar zona:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar zona:', error);
    }
  }

   /* ▸ Se dispara cuando el usuario cambia el select de ZIP */
  async onZipChange(ev: any) {
    if (ev.detail.value !== '__nuevo__') return;

    /* 1. Pedir al usuario el nuevo código postal ------------- */
    const alert = await this.alertCtrl.create({
      header: 'Nuevo código postal',
      inputs: [
        {
          name: 'codezip',
          type: 'text',
          placeholder: 'Ej.: 28001',
        },
        {
          name: 'name',
          type: 'text',
          placeholder: 'Descripción (opcional)',
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', handler: () => this.zonaForm.patchValue({ codezip: '' }) },
        {
          text: 'Crear',
          handler: async (values) => {
            if (!values.codezip?.trim()) {
              this.zonaForm.patchValue({ codezip: '' });
              return;
            }

            try {
              /* 2. Crear ZIP en backend ------------------------ */
              const res = await firstValueFrom(
                this._zipcodes.createZipcode({ codezip: values.codezip.trim(), name: values.name })
              );

              if (res.ok) {
                const nuevoZip = res.data.zipcode;
                /* 3. Añadir a la lista y seleccionar ------------ */
                this.zipcodesDisponibles.push(nuevoZip);
                this.zonaForm.patchValue({ codezip: nuevoZip._id });
              } else {
                this.zonaForm.patchValue({ codezip: '' });
              }
            } catch (e) {
              console.error('Error creando ZIP:', e);
              this.zonaForm.patchValue({ codezip: '' });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async guardar() {


    if (this.zonaForm.invalid) return;

    const data = this.zonaForm.value;

    const zipSeleccionado = this.zipcodesDisponibles.find(z => z._id === data.codezip);
    if (!zipSeleccionado && data.codezip) {
      try {
        const nuevo = await firstValueFrom(this._zipcodes.createZipcode({ codezip: data.codezip }));
        if (nuevo.ok) {
          this.zipcodesDisponibles.push(nuevo.data.zipcode);
          data.codezip = nuevo.data.zipcode._id; // usamos su id real
        }
      } catch (e) { console.error('Error creando ZIP:', e); }
    }


    try {
      if (!this.isEdit) {
        // Crear
        const req = await this._zona.createZone(data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/zonas');
        });
      } else {
        // Editar
        data._id = this.zonaId;
        const req = await this._zona.updateZone(this.zonaId!, data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/zonas');
        });
      }
    } catch (error) {
      console.error('Error guardando zona:', error);
    }
  }

  cancel() {
    // Volver a la lista de zonas
    this.navCtrl.navigateBack('/zonas');
  }
}
