import { UserService } from './../../../services/user.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-form-usuario',
  standalone: false,
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.scss']
})
export class FormUsuarioComponent implements OnInit {

  usuarioForm!: FormGroup;
  isEdit = false;
  usuarioId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _user: UserService
  ) { }

  ngOnInit() {
    this.initForm();

    // Revisar si hay :id en la ruta, para modo edición
    // Usar snapshot para obtener el ID de forma síncrona
    this.usuarioId = this.route.snapshot.paramMap.get('id');
    console.log('FormUsuarioComponent - ID obtenido de la ruta:', this.usuarioId);
    if (this.usuarioId) {
      this.isEdit = true;
      // Agregar validación requerida al campo código cuando se edita
      this.usuarioForm.get('code')?.setValidators([Validators.required]);
      this.usuarioForm.get('code')?.updateValueAndValidity();
      this.cargarUsuario(this.usuarioId);
    } else {
      console.warn('FormUsuarioComponent - No se encontró ID en la ruta');
    }
  }

  initForm() {
    this.usuarioForm = this.fb.group({
      name: ['', [Validators.required]],
      code: [''], // Sin validadores inicialmente
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      role: ['WORKER', Validators.required],
      junior: [false],
      password: ['']
    });
  }
  async cargarUsuario(id: string) {
    console.log('Cargando usuario con ID:', id);
    try {
      const req = await this._user.getUserById(id);
      req.subscribe({
        next: (response: any) => {
          console.log('Respuesta del servidor al cargar usuario:', response);
          const user = response?.data?.user || response?.user || response?.data || response;
          console.log('Usuario extraído:', user);
          if (user) {
            this.usuarioForm.patchValue({
              name: user.name || '',
              code: user.code || '',
              email: user.email || '',
              phone: user.phone || '',
              role: user.role || 'WORKER',
              junior: user.junior || false
            });
            console.log('Formulario actualizado con datos del usuario');
          } else {
            console.warn('No se encontró información del usuario en la respuesta');
          }
        },
        error: (error) => {
          console.error('Error al cargar usuario:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  }

  

  async guardar() {

    if (this.usuarioForm.invalid) { return; }

    const data = this.usuarioForm.value;
    try {
      
      if (this.isEdit) {
        if (!this.usuarioId) {
          console.error('Error: No se pudo obtener el ID del usuario para editar');
          return;
        }
        const req : any = await this._user.updateUser({ ...data, _id: this.usuarioId });
        req.subscribe((response: any) => {
          if (response?.ok) {
            this.navCtrl.navigateRoot('/usuarios');
          }
        });
      } else {
        const req : any = await this._user.createUser(data);
        req.subscribe((response: any) => {
          if (response?.ok) {
            this.navCtrl.navigateRoot('/usuarios');
          }
        });
      }

    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }
  }


  cancelar() {
    // Navegar de vuelta a la lista de usuarios
    this.navCtrl.navigateBack('/usuarios');
  }
}
