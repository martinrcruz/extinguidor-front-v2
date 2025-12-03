import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap, filter, take } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { ApiResponse } from '../models/api-response.model';
import { AlertController } from '@ionic/angular';

interface LoginResponse {
  token: string;
  role: string;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/user`;
  private _storage: Storage | null = null;
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<any>(null);
  private storageInitialized = new BehaviorSubject<boolean>(false);

  public user$ = this.userSubject.asObservable();
  public storageReady$ = this.storageInitialized.asObservable();

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    this.init();
  }

  async init() {
    try {
      const store = await this.storage.create();
      this._storage = store;
      await this.checkToken();
      this.storageInitialized.next(true);
    } catch (error) {
      console.error('Error initializing storage', error);
      this.storageInitialized.next(true); // Marcar como inicializado incluso con error
      this.isLoggedInSubject.next(false);
    }
  }

  /**
   * Espera a que el storage esté inicializado
   */
  async waitForStorage(): Promise<void> {
    return this.storageReady$.pipe(
      filter(ready => ready === true),
      take(1)
    ).toPromise() as Promise<void>;
  }

  async checkToken() {
    try {
      const token = await this._storage?.get('token');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const now = Math.floor(Date.now() / 1000); // en segundos

          if (decoded.exp && decoded.exp > now) {
            // Token válido y no expirado
            // El token del backend tiene: sub (email), role, userId
            const user = {
              email: decoded.sub || decoded.email,
              role: decoded.role?.toLowerCase() || decoded.role,
              userId: decoded.userId || decoded.user_id,
              _id: decoded.userId || decoded.user_id
            };
            
            this.userSubject.next(user);
            this.isLoggedInSubject.next(true);
            console.log('Token válido encontrado, usuario:', user);
          } else {
            // Token expirado
            console.log('Token expirado, limpiando storage');
            await this.removeToken();
          }
        } catch (decodeError) {
          // Error al decodificar el token (puede ser token inválido o corrupto)
          console.error('Error al decodificar token, limpiando storage:', decodeError);
          await this.removeToken();
        }
      } else {
        console.log('No hay token almacenado');
        this.isLoggedInSubject.next(false);
      }
    } catch (error) {
      console.error('Error checking token', error);
      await this.removeToken();
    }
  }

  isLoggedIn() {
    return this.isLoggedInSubject.asObservable();
  }

  async setToken(token: string, userData?: any) {
    try {
      if (!token) {
        throw new Error('Token is empty');
      }
      
      await this._storage?.set('token', token);
      
      // Decodificar el token para obtener información básica
      const decoded: any = jwtDecode(token);
      
      // Construir objeto de usuario desde el token o usar userData si está disponible
      const user = userData || {
        email: decoded.sub || decoded.email,
        role: decoded.role?.toLowerCase() || decoded.role,
        userId: decoded.userId || decoded.user_id,
        _id: decoded.userId || decoded.user_id,
        name: decoded.name,
        ...decoded
      };
      
      this.userSubject.next(user);
      this.isLoggedInSubject.next(true);
      console.log('Token guardado, usuario:', user);
      
      return true;
    } catch (error) {
      console.error('Error setting token', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await this._storage?.get('token');
      
      if (token) {
        const decoded: any = jwtDecode(token);
        const now = Math.floor(Date.now() / 1000);
        
        if (decoded.exp && decoded.exp > now) {
          return token;
        } else {
          console.log('Token expired when getting');
          await this.removeToken();
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting token', error);
      return null;
    }
  }

  async removeToken() {
    try {
      await this._storage?.remove('token');
      this.userSubject.next(null);
      this.isLoggedInSubject.next(false);
    } catch (error) {
      console.error('Error removing token', error);
    }
  }

  register(userData: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/create`, userData)
      .pipe(
        catchError(error => {
          console.error('Error en el registro:', error);
          this.showAlert('Error', 'No se pudo completar el registro. Por favor, inténtelo de nuevo.');
          return throwError(() => error);
        })
      );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<LoginResponse>> {
    // Eliminamos el token anterior si existe
    this.removeToken();
    
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, credentials, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    }).pipe(
      tap(response => {
        if (response.ok && response.data?.token) {
          // El backend retorna: { token, role, user }
          const userData = response.data?.user || {};
          const user = {
            ...userData,
            email: userData.email || credentials.email,
            role: (response.data.role || userData.role)?.toLowerCase(),
            userId: userData.id || userData._id,
            _id: userData.id || userData._id
          };
          
          // Guardar token con información del usuario
          this.setToken(response.data.token, user);
          console.log('Login exitoso, usuario:', user);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas. Por favor, verifique su correo y contraseña.';
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor. Compruebe su conexión a internet.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.showAlert('Error de inicio de sesión', errorMessage);
        return throwError(() => error);
      })
    );
  }

  getUser() {
    return this.userSubject.value;
  }

  async getRole(): Promise<string | null> {
    // Asegurarnos de que el storage esté inicializado
    await this.waitForStorage();
    
    const user = this.getUser();
    if (user?.role) {
      return user.role.toLowerCase();
    }
    
    // Si no hay usuario en el subject, intentar obtenerlo del token
    const token = await this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const role = decoded.role || decoded.rol;
        if (role) {
          return role.toLowerCase();
        }
      } catch (error) {
        console.error('Error decoding token for role', error);
      }
    }
    
    return null;
  }

  async getHeaders() {
    const token = await this.getToken();
    if (token) {
      return {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'x-token': token,
          'Accept': 'application/json'
        })
      };
    }
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  async logout() {
    try {
      console.log('Cerrando sesión y limpiando storage...');
      this.userSubject.next(null);
      await this.removeToken();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error during logout', error);
    }
  }

  /**
   * Limpia completamente el storage
   * Útil cuando hay problemas con tokens antiguos
   */
  async clearStorage() {
    try {
      console.log('Limpiando storage completamente...');
      await this._storage?.clear();
      this.userSubject.next(null);
      this.isLoggedInSubject.next(false);
      console.log('Storage limpiado exitosamente');
    } catch (error) {
      console.error('Error limpiando storage', error);
    }
  }

  async getCurrentUserId(): Promise<string> {
    const user = this.userSubject.value;
    if (user && user._id) {
      return user._id;
    }
    
    const token = await this._storage?.get('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.user && decoded.user._id) {
          return decoded.user._id;
        }
      } catch (error) {
        console.error('Error getting current user ID', error);
      }
    }
    
    throw new Error('No hay usuario autenticado');
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
