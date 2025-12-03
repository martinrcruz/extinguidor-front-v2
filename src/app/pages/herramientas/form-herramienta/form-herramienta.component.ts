import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { HerramientasService } from 'src/app/services/herramientas.service';
import { MaterialCategory, MaterialCategoryLabels } from 'src/app/models/material-category.enum';
import { isoDateOnly } from 'src/app/shared/utils/date.utils';

@Component({
  selector: 'app-form-herramienta',
  standalone: false,
  templateUrl: './form-herramienta.component.html',
  styleUrls: ['./form-herramienta.component.scss'],
})
export class FormHerramientaComponent  implements OnInit {

  herramientaForm!: FormGroup;
  isEdit = false;
  herramientaId: string | null = null;
  categorias: { value: MaterialCategory; label: string }[] = [];
  maxDate: string = new Date().toISOString();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _herramienta: HerramientasService
  ) {
    // Inicializar categorías
    this.categorias = Object.values(MaterialCategory).map(value => ({
      value: value as MaterialCategory,
      label: MaterialCategoryLabels[value as MaterialCategory]
    }));
  }

  ngOnInit() {
    this.initForm();
    // Obtener el ID del snapshot primero (más confiable para la carga inicial)
    const idFromSnapshot = this.route.snapshot.paramMap.get('id');
    if (idFromSnapshot) {
      this.herramientaId = idFromSnapshot;
      this.isEdit = true;
      console.log('ID obtenido del snapshot:', this.herramientaId);
      this.cargarHerramienta(this.herramientaId);
    } else {
      this.isEdit = false;
      this.herramientaId = null;
    }
    
    // También suscribirse a cambios en los parámetros (por si cambia la ruta)
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== this.herramientaId) {
        this.herramientaId = id;
        this.isEdit = true;
        console.log('ID obtenido de la suscripción:', this.herramientaId);
        this.cargarHerramienta(this.herramientaId);
      } else if (!id && this.isEdit) {
        this.isEdit = false;
        this.herramientaId = null;
      }
    });
  }

  initForm() {
    this.herramientaForm = this.fb.group({
      name:        ['', Validators.required],
      code:        ['', Validators.required],
      description: [''],
      fechaUltimoMantenimiento: [''],
      color: [''],
      categoria: ['']
    });
  }

  async cargarHerramienta(id: string) {
    if (!id) {
      console.error('No se proporcionó el ID de la herramienta');
      return;
    }
    try {
      const req = this._herramienta.getHerramientaById(id);
      req.subscribe({
        next: (res: any) => {
          console.log('Respuesta herramienta:', res);
          // El servicio devuelve la respuesta completa del API
          if (res.ok && res.data?.material) {
            // El backend usa /material para herramientas también
            const herramienta = res.data.material;
            // Asegurar que el ID se guarde correctamente
            if (herramienta._id) {
              this.herramientaId = herramienta._id;
            }
            this.herramientaForm.patchValue({
              name:        herramienta.name,
              code:        herramienta.code,
              description: herramienta.description,
              fechaUltimoMantenimiento: herramienta.fechaUltimoMantenimiento ? isoDateOnly(herramienta.fechaUltimoMantenimiento) : '',
              color: herramienta.color || '',
              categoria: herramienta.categoria || ''
            });
          } else if (res.ok && res.data?.herramienta) {
            // Fallback por si cambia la estructura
            const herramienta = res.data.herramienta;
            // Asegurar que el ID se guarde correctamente
            if (herramienta._id) {
              this.herramientaId = herramienta._id;
            }
            this.herramientaForm.patchValue({
              name:        herramienta.name,
              code:        herramienta.code,
              description: herramienta.description,
              fechaUltimoMantenimiento: herramienta.fechaUltimoMantenimiento ? isoDateOnly(herramienta.fechaUltimoMantenimiento) : '',
              color: herramienta.color || '',
              categoria: herramienta.categoria || ''
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar herramienta:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar herramienta:', error);
    }
  }

  async guardar() {
    if (this.herramientaForm.invalid) return;

    const data = { ...this.herramientaForm.value };
    // Formatear la fecha si existe
    if (data.fechaUltimoMantenimiento) {
      data.fechaUltimoMantenimiento = isoDateOnly(data.fechaUltimoMantenimiento);
    }
    try {
      if (!this.isEdit) {
        // Crear
        const req = await this._herramienta.createHerramienta(data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/herramientas');
        });
      } else {
        // Editar
        if (!this.herramientaId) {
          console.error('No se proporcionó el ID de la herramienta para editar');
          return;
        }
        const req = await this._herramienta.updateHerramienta(this.herramientaId, data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/herramientas');
        });
      }
    } catch (error) {
      console.error('Error al guardar herramienta:', error);
    }
  }

  cancelar() {
    // Volver a la lista de herramientas
    this.navCtrl.navigateBack('/herramientas');
  }
}
