import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly baseUrl = `${environment.apiUrl}/export`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Exportar partes a Excel
   */
  async exportPartesToExcel(): Promise<Observable<Blob>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.get(
      `${this.baseUrl}/partes/excel`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Exportar partes a PDF
   */
  async exportPartesToPDF(): Promise<Observable<Blob>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.get(
      `${this.baseUrl}/partes/pdf`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Exportar clientes a Excel
   */
  async exportCustomersToExcel(): Promise<Observable<Blob>> {
    const token = await this.authService.getToken();
    const headers = new HttpHeaders({
      'x-token': token || ''
    });
    
    return this.http.get(
      `${this.baseUrl}/clientes/excel`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Descargar archivo (helper genérico)
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

