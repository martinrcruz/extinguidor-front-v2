import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { HerramientasService } from 'src/app/services/herramientas.service';

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _herramienta: HerramientasService
  ) {}

  ngOnInit() {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.herramientaId = params.get('id');
      if (this.herramientaId) {
        this.isEdit = true;
        this.cargarHerramienta(this.herramientaId);
      }
    });
  }

  initForm() {
    this.herramientaForm = this.fb.group({
      name:        ['', Validators.required],
      code:        ['', Validators.required],
      description: ['']
    });
  }

  async cargarHerramienta(id: string) {
    try {
      const req = this._herramienta.getHerramientaById(id);
      req.subscribe({
        next: (res: any) => {
          console.log('Respuesta herramienta:', res);
          // El servicio devuelve la respuesta completa del API
          if (res.ok && res.data?.material) {
            // El backend usa /material para herramientas también
            const herramienta = res.data.material;
            this.herramientaForm.patchValue({
              name:        herramienta.name,
              code:        herramienta.code,
              description: herramienta.description
            });
          } else if (res.ok && res.data?.herramienta) {
            // Fallback por si cambia la estructura
            const herramienta = res.data.herramienta;
            this.herramientaForm.patchValue({
              name:        herramienta.name,
              code:        herramienta.code,
              description: herramienta.description
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

    const data = this.herramientaForm.value;
    try {
      if (!this.isEdit) {
        // Crear
        const req = await this._herramienta.createHerramienta(data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/herramientas');
        });
      } else {
        // Editar
        data._id = this.herramientaId;
        const req = await this._herramienta.updateHerramienta(data._id, data);
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
