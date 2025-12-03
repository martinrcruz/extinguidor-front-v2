import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly baseUrl = `${environment.apiUrl}/file`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Subir archivo de parte
   */
  async uploadParteFile(file: File): Promise<Observable<string>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.post<string>(
      `${this.baseUrl}/upload/parte`,
      formData,
      { headers, responseType: 'text' as 'json' }
    );
  }

  /**
   * Subir archivo de cliente
   */
  async uploadClienteFile(file: File): Promise<Observable<string>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.post<string>(
      `${this.baseUrl}/upload/cliente`,
      formData,
      { headers, responseType: 'text' as 'json' }
    );
  }

  /**
   * Subir imagen
   */
  async uploadImage(file: File): Promise<Observable<string>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.post<string>(
      `${this.baseUrl}/upload/image`,
      formData,
      { headers, responseType: 'text' as 'json' }
    );
  }

  /**
   * Descargar archivo de parte
   */
  async downloadParteFile(filename: string): Promise<Observable<Blob>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.get(
      `${this.baseUrl}/download/parte/${filename}`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Descargar archivo de cliente
   */
  async downloadClienteFile(filename: string): Promise<Observable<Blob>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.get(
      `${this.baseUrl}/download/cliente/${filename}`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Obtener imagen
   */
  async getImage(filename: string): Promise<Observable<Blob>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.get(
      `${this.baseUrl}/image/${filename}`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Obtener URL de imagen
   */
  async getImageUrl(filename: string): Promise<string> {
    const token = await this.authService.getToken();
    return `${this.baseUrl}/image/${filename}?token=${token}`;
  }

  /**
   * Eliminar archivo de parte
   */
  async deleteParteFile(filename: string): Promise<Observable<void>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.delete<void>(
      `${this.baseUrl}/parte/${filename}`,
      { headers }
    );
  }

  /**
   * Eliminar archivo de cliente
   */
  async deleteClienteFile(filename: string): Promise<Observable<void>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.delete<void>(
      `${this.baseUrl}/cliente/${filename}`,
      { headers }
    );
  }

  /**
   * Eliminar imagen
   */
  async deleteImage(filename: string): Promise<Observable<void>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.delete<void>(
      `${this.baseUrl}/image/${filename}`,
      { headers }
    );
  }
}

