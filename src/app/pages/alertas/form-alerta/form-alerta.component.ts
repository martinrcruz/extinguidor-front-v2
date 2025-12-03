import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AlertaService } from '../../../services/alerta.service';
import { Alerta } from '../../../models/alerta.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-alerta',
  standalone: false,
  templateUrl: './form-alerta.component.html',
  styleUrls: ['./form-alerta.component.scss'],
})
export class FormAlertaComponent implements OnInit {
  alertaForm!: FormGroup;
  isEdit = false;
  alertaId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private alertaService: AlertaService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.alertaId = params.get('id');
      if (this.alertaId) {
        this.isEdit = true;
        // Si se necesita editar, aquí cargarías la alerta
      }
    });
  }

  initForm() {
    this.alertaForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['Media', Validators.required],
      state: ['Pendiente', Validators.required],
      customer: [''],
      parte: ['']
    });
  }

  async guardar() {
    if (this.alertaForm.invalid) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor complete todos los campos requeridos',
        duration: 2000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando alerta...'
    });
    await loading.present();

    try {
      const formData = this.alertaForm.value;
      
      await firstValueFrom(this.alertaService.createAlerta(formData));

      const toast = await this.toastCtrl.create({
        message: 'Alerta creada exitosamente',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();

      this.router.navigate(['/alertas']);
    } catch (error) {
      console.error('Error al guardar alerta:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al guardar la alerta',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  cancelar() {
    this.router.navigate(['/alertas']);
  }
}
