import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ArticuloService } from 'src/app/services/articulo.service';

@Component({
  selector: 'app-form-articulo',
  standalone: false,
  templateUrl: './form-articulo.component.html',
  styleUrls: ['./form-articulo.component.scss'],
})
export class FormArticuloComponent implements OnInit {
  articuloForm!: FormGroup;
  isEdit = false;
  articuloId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _articulo: ArticuloService
  ) {}

  ngOnInit() {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.articuloId = params.get('id');
      if (this.articuloId) {
        this.isEdit = true;
        this.cargarArticulo(this.articuloId);
      }
    });
  }

  initForm() {
    this.articuloForm = this.fb.group({
      codigo: ['', Validators.required],
      descripcionArticulo: ['', Validators.required],
      grupo: ['', Validators.required],
      familia: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]]
    });
  }

  async cargarArticulo(id: string) {
    try {
      const req = this._articulo.getArticuloById(id);
      req.subscribe({
        next: (articulo: any) => {
          if (articulo) {
            this.articuloForm.patchValue({
              codigo: articulo.codigo,
              descripcionArticulo: articulo.descripcionArticulo,
              grupo: articulo.grupo,
              familia: articulo.familia,
              cantidad: articulo.cantidad,
              precioVenta: articulo.precioVenta
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar articulo:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar articulo:', error);
    }
  }

  async guardar() {
    if (this.articuloForm.invalid) return;
    const data = this.articuloForm.value;
    try {
      if (!this.isEdit) {
        // Crear
        const req = await this._articulo.createArticulo(data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/articulos');
        });
      } else {
        // Editar
        const req = await this._articulo.updateArticulo(this.articuloId!, data);
        req.subscribe(() => {
          this.navCtrl.navigateRoot('/articulos');
        });
      }
    } catch (error) {
      console.error('Error al guardar articulo:', error);
    }
  }
} 