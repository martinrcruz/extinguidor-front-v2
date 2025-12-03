// app.component.ts (extracto)
import { registerLocaleData } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import localeEs from '@angular/common/locales/es';

interface AppPage {
  title: string;
  url?: string;   // si es un submenú principal sin URL, lo omites
  icon?: string;
  subpages?: AppPage[];
  expanded?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public showMenu = false;  // Controla si se muestra o no el menú
  public userRole: 'admin' | 'worker' | '' = '';  // almacenar el rol

  // Definimos un conjunto completo de opciones
  private fullAppPages: AppPage[] = [
    { title: 'Dashboard',  url: '/dashboard',   icon: 'bi-speedometer2' },
    { title: 'Calendario', url: '/calendario',  icon: 'bi-calendar-check' },
    { title: 'Partes',     url: '/partes',      icon: 'bi-file-text' },
    { title: 'Contratos',  url: '/clientes',    icon: 'bi-people-fill' },
    { title: 'Facturación',url: '/facturacion', icon: 'bi-cash-stack' },
    { title: 'Alertas',    url: '/alertas',     icon: 'bi-bell' },
    {
      title: 'Administración',
      icon: 'bi-briefcase',
      expanded: false,
      subpages: [
        { title: 'Vehículos',    url: '/vehiculos',    icon: 'bi-truck' },
        { title: 'Herramientas', url: '/herramientas', icon: 'bi-tools' },
        { title: 'Zonas',        url: '/zonas',        icon: 'bi-geo-alt' },
        { title: 'Rutas',        url: '/rutas',        icon: 'bi-map' },
        { title: 'Usuarios',     url: '/usuarios',     icon: 'bi-people' },
        { title: 'Artículos',    url: '/articulos',    icon: 'bi-box' },
      ]
    }
  ];

  // Para el rol worker, solo dejamos Calendario
  private workerAppPages: AppPage[] = [
    { title: 'Calendario', url: '/worker-dashboard',  icon: 'bi-calendar-check' }
  ];

  // Este es el array que se renderiza en la plantilla:
  public appPages: AppPage[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Ocultar menú si la ruta es /login (o /auth/login)
        if (event.url === '/login' || event.urlAfterRedirects === '/login' ||
            event.url === '/auth/login' || event.urlAfterRedirects === '/auth/login') {
          this.showMenu = false;
        } else {
          this.showMenu = true;
        }
      });

    registerLocaleData(localeEs, 'es');

    // Esperar a que el storage esté inicializado antes de configurar las suscripciones
    this.initializeApp();
  }

  /**
   * Inicializa la aplicación esperando a que el storage esté listo
   */
  private async initializeApp() {
    try {
      // Esperar a que el storage esté inicializado
      await this.authService.waitForStorage();
      console.log('App: Storage inicializado, configurando usuario');

      // Verificar estado inicial
      const initialUser = this.authService.getUser();
      if (initialUser && initialUser.role) {
        this.userRole = initialUser.role;
        this.updateMenuByRole();
      }

      // Suscribirse a cambios en el usuario
      this.authService.user$.subscribe(user => {
        if (user && user.role) {
          const newRole = user.role.toLowerCase();
          if (this.userRole !== newRole) {
            this.userRole = newRole;
            console.log('App: Usuario autenticado con rol:', this.userRole);
            this.updateMenuByRole();
            
            // Solo redirigir si estamos en la ruta de login o raíz
            const currentUrl = this.router.url;
            if (currentUrl === '/' || currentUrl === '/auth/login' || currentUrl.includes('login')) {
              // Redirigir según el rol
              if (this.userRole === 'worker') {
                console.log('App: Redirigiendo a worker-dashboard');
                this.router.navigate(['/worker-dashboard'], { replaceUrl: true });
              } else if (this.userRole === 'admin') {
                console.log('App: Redirigiendo a home');
                this.router.navigate(['/home'], { replaceUrl: true });
              }
            }
          }
        } else {
          // Usuario no autenticado
          if (this.userRole !== '') {
            console.log('App: Usuario desautenticado');
            this.userRole = '';
            this.updateMenuByRole();
            
            // Solo redirigir a login si no estamos ya ahí
            const currentUrl = this.router.url;
            if (currentUrl !== '/auth/login' && !currentUrl.includes('login') && !currentUrl.includes('auth')) {
              console.log('App: Redirigiendo a login desde:', currentUrl);
              this.router.navigate(['/auth/login'], { replaceUrl: true });
            }
          }
        }
      });
    } catch (error) {
      console.error('App: Error al inicializar', error);
      // No redirigir automáticamente, dejar que los guards manejen la navegación
    }
  }

  /**
   * Ajusta el menú según el rol:
   */
  updateMenuByRole() {
    if (this.userRole === 'worker') {
      this.appPages = this.workerAppPages;
    } else {
      // Admin o cualquiera => menú completo
      this.appPages = this.fullAppPages;
    }
  }

  /**
   * Toggle para expandir/colapsar submenús
   */
  toggleSubMenu(page: AppPage) {
    if (page.subpages) {
      page.expanded = !page.expanded;
    }
  }

  /**
   * Logout
   */
  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
