import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;

  constructor(
    private authService: AuthService,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    // Limpiar el storage al llegar a la página de login
    // Esto elimina cualquier token antiguo que pueda causar errores 403
    console.log('Inicializando login, limpiando storage...');
    await this.authService.clearStorage();
  }

  async onLogin() {
    try {
      // Llamada al servicio de autenticación
      const response: any = await this.authService
        .login({ email: this.email, password: this.password })
        .toPromise();

      if (response?.ok) {
        // Esperar un momento para que el token se guarde
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Obtener el rol del usuario
        const role = await this.authService.getRole();
        const normalizedRole = role?.toLowerCase();
        
        // Navegar según el rol
        if (normalizedRole === 'worker') {
          console.log('Login: Redirigiendo a worker-dashboard');
          this.navCtrl.navigateRoot('/worker-dashboard', { animated: true });
        } else if (normalizedRole === 'admin') {
          console.log('Login: Redirigiendo a home');
          this.navCtrl.navigateRoot('/calendario', { animated: true });
        } else {
          // Fallback a calendario si no hay rol claro
          console.log('Login: Redirigiendo a calendario (fallback)');
          this.navCtrl.navigateRoot('/calendario', { animated: true });
        }
      } else {
        console.error('Error en login:', response?.message);
      }
    } catch (error) {
      console.error('Error en login:', error);
    }
  }

  onForgotPassword() {
    // Aquí puedes navegar a una página de recuperación de contraseña o mostrar un modal
    this.navCtrl.navigateForward('/forgot-password');
  }
}
