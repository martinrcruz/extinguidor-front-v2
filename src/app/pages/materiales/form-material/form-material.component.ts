import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { MaterialesService } from 'src/app/services/materiales.service';
@Component({
  selector: 'app-form-material',
  standalone: false,
  templateUrl: './form-material.component.html',
  styleUrls: ['./form-material.component.scss'],
})
export class FormMaterialComponent  implements OnInit {

  materialForm!: FormGroup;
  isEdit = false;
  materialId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _material: MaterialesService
  ) {}

  ngOnInit() {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.materialId = params.get('id');
      if (this.materialId) {
        this.isEdit = true;
        this.cargarMaterial(this.materialId);
      }
    });
  }

  initForm() {
    this.materialForm = this.fb.group({
      name:        ['', Validators.required],
      code:        ['', Validators.required],
      description: [''],
      type:        ['']
    });
  }

  async cargarMaterial(id: string) {
    try {
      const req = this._material.getMaterialById(id);
      req.subscribe({
        next: (material: any) => {
          if (material) {
            this.materialForm.patchValue({
              name:        material.name,
              code:        material.code,
              description: material.description,
              type:        material.type
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar material:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar material:', error);
    }
  }

  async guardar() {
    if (this.materialForm.invalid) return;
    const data = this.materialForm.value;
    try {
      if (!this.isEdit) {
        // Crear
        const req = await this._material.createMaterial(data);
        req.subscribe((resp: any) => {
          if (resp?.ok !== false) {
            this.navCtrl.navigateRoot('/materiales');
          } else {
            console.error('Error al crear material:', resp.error);
          }
        });
      } else {
        // Editar
        if (!this.materialId) {
          console.error('No se proporcionó el ID del material');
          return;
        }
        data._id = this.materialId;
        const req = await this._material.updateMaterial(this.materialId, data);
        req.subscribe((resp: any) => {
          if (resp?.ok !== false) {
            this.navCtrl.navigateRoot('/materiales');
          } else {
            console.error('Error al actualizar material:', resp.error);
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar material:', error);
    }
  }
}
