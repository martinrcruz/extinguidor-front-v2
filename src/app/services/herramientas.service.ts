import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class HerramientasService extends BaseService {
  private readonly endpoint = '/herramientas';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todas las herramientas (GET /herramientas)
   */
  getHerramientas(): Observable<any> {
    return this.get<any>(this.endpoint);
  }

  /**
   * Obtener herramienta por ID (GET /herramientas/:id)
   */
  getHerramientaById(id: string): Observable<any> {
    return this.get<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Crear herramienta (POST /herramientas/create)
   */
  createHerramienta(data: any): Observable<any> {
    return this.post<any>(`${this.endpoint}/create`, data);
  }

  /**
   * Actualizar herramienta (PUT /herramientas/update/:id)
   */
  updateHerramienta(id: string, data: any): Observable<any> {
    return this.put<any>(`${this.endpoint}/update/${id}`, data);
  }

  /**
   * Eliminar herramienta (DELETE /herramientas/:id)
   */
  deleteHerramienta(id: string): Observable<any> {
    return this.delete<any>(`${this.endpoint}/${id}`);
  }
} 