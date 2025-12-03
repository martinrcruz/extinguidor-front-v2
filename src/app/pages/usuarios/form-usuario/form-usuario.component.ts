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
    this.route.paramMap.subscribe(params => {
      this.usuarioId = params.get('id');
      if (this.usuarioId) {
        this.isEdit = true;
        // Agregar validación requerida al campo código cuando se edita
        this.usuarioForm.get('code')?.setValidators([Validators.required]);
        this.usuarioForm.get('code')?.updateValueAndValidity();
        this.cargarUsuario(this.usuarioId);
      }
    });
  }

  initForm() {
    this.usuarioForm = this.fb.group({
      name: ['', [Validators.required]],
      code: [''], // Sin validadores inicialmente
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      role: ['worker', Validators.required],
      junior: [false],
      password: ['']
    });
  }
  async cargarUsuario(id: string) {
    try {
      const req = await this._user.getUserById(id);
      req.subscribe({
        next: (response: any) => {
          const user = response?.data?.user || response?.user || response?.data || response;
          if (user) {
            this.usuarioForm.patchValue({
              name: user.name || '',
              code: user.code || '',
              email: user.email || '',
              phone: user.phone || '',
              role: user.role || 'worker',
              junior: user.junior || false
            });
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
      
      const req : any = this.isEdit
        ? await this._user.updateUser({ ...data, _id: this.usuarioId! })
        : await this._user.createUser(data);

      req.subscribe((response: any) => {
        if (response?.ok) {
          this.navCtrl.navigateRoot('/usuarios');
        }

      });


    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }
  }


  cancelar() {
    // Navegar de vuelta a la lista de usuarios
    this.navCtrl.navigateBack('/usuarios');
  }
}
