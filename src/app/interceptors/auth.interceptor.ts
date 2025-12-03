import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap, finalize, tap, share } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private activeLoaders: HTMLIonLoadingElement[] = [];
  private loadingTimeout: any;
  private pendingRequests = new Map<string, Observable<HttpEvent<unknown>>>();
  private readonly CACHE_DURATION = 100; // 100ms para evitar duplicados

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Crear una clave única para esta petición
    const requestKey = `${request.method}_${request.url}_${JSON.stringify(request.body || {})}`;
    
    // Verificar si hay una petición idéntica en curso
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      console.log(`[AuthInterceptor] Reutilizando petición en curso: ${request.method} ${request.url}`);
      return pendingRequest;
    }
    
    console.log(`[AuthInterceptor] Procesando petición: ${request.method} ${request.url}`);
    
    // Crear el observable de la petición y compartirlo para reutilizarlo
    const requestObservable = from(this.authService.getToken()).pipe(
      switchMap(token => {
        // Ajustamos las cabeceras para CORS
        const headers: any = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        if (token) {
          headers['x-token'] = token;
        }

        request = request.clone({
          setHeaders: headers,
          withCredentials: false
        });

        // Comprobar si es una operación que requiere mostrar carga
        const isLongOperation = this.isLongRunningOperation(request);
        let loadingElement: HTMLIonLoadingElement | null = null;

        if (isLongOperation) {
          // Creamos un control de tiempo para evitar que el loading se quede abierto demasiado tiempo
          from(this.showLoading()).subscribe(loading => {
            loadingElement = loading;
            this.activeLoaders.push(loading);
            
            // Establecemos un timeout de seguridad para cerrar el loading
            this.loadingTimeout = setTimeout(() => {
              this.dismissLoader(loading);
            }, 5000); // 5 segundos máximo
          });
        }

        return next.handle(request).pipe(
          tap(event => {
            // Si la respuesta es exitosa y es final (no es un evento de progreso), cerramos el loader
            if (event instanceof HttpResponse && loadingElement) {
              clearTimeout(this.loadingTimeout);
              this.dismissLoader(loadingElement);
            }
          }),
          catchError((error: HttpErrorResponse) => {
            // Cancelamos el timeout y cerramos el loader
            if (this.loadingTimeout) {
              clearTimeout(this.loadingTimeout);
            }
            
            if (loadingElement) {
              this.dismissLoader(loadingElement);
            }

            // Manejar errores específicos
            if (error.status === 0) {
              this.showErrorToast('Error de conexión. Compruebe su conexión a internet o contacte con el administrador.');
              console.error('Error de conexión:', error);
              return throwError(() => 'Error de conexión con el servidor. Por favor, compruebe su conexión a internet.');
            }
            
            if (error.status === 401 || error.status === 403) {
              // Token inválido, expirado o sin permisos
              console.error('Error de autenticación:', error.status);
              this.authService.logout();
              this.router.navigate(['/auth/login']);
              
              const message = error.status === 401 
                ? 'Sesión expirada. Por favor, inicie sesión nuevamente.'
                : 'Token inválido o sin permisos. Por favor, inicie sesión nuevamente.';
              
              this.showErrorToast(message);
              return throwError(() => message);
            }
            
            if (error.status === 429) {
              this.showErrorToast('Demasiadas solicitudes. Por favor, espere unos momentos.');
              return throwError(() => 'Demasiadas solicitudes. Por favor, intente más tarde.');
            }

            if (error.status >= 500) {
              this.showErrorToast('Error en el servidor. Por favor, inténtelo de nuevo más tarde.');
              return throwError(() => 'Error interno del servidor. Por favor, intente nuevamente más tarde.');
            }

            // Para otros errores
            const errorMsg = error.error?.message || error.message || 'Error desconocido';
            this.showErrorToast(errorMsg);
            return throwError(() => errorMsg);
          }),
          finalize(() => {
            // Asegurarnos de que el loader se cierre al finalizar, sea error o éxito
            if (this.loadingTimeout) {
              clearTimeout(this.loadingTimeout);
            }
            
            if (loadingElement) {
              this.dismissLoader(loadingElement);
            }
            
            // Remover la petición del caché cuando termine
            this.pendingRequests.delete(requestKey);
          }),
          // Compartir el observable para que múltiples suscriptores reciban el mismo resultado
          share()
        );
      }),
      // Compartir el observable completo para reutilización
      share()
    );

    // Guardar la petición en el caché
    this.pendingRequests.set(requestKey, requestObservable);

    return requestObservable;
  }

  private dismissLoader(loader: HTMLIonLoadingElement) {
    if (loader) {
      // Removemos el loader de la lista de activos
      const index = this.activeLoaders.indexOf(loader);
      if (index > -1) {
        this.activeLoaders.splice(index, 1);
      }
      
      // Cerramos el loader
      loader.dismiss().catch(err => console.error('Error al cerrar el loader:', err));
    }
  }

  private isLongRunningOperation(request: HttpRequest<unknown>): boolean {
    return request.method === 'POST' || request.method === 'PUT' || 
           request.url.includes('upload') || request.url.includes('create');
  }

  private async showLoading(): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando...',
      duration: 3000, // Duración reducida a 3 segundos
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: ['OK']
    });
    await toast.present();
  }
} 