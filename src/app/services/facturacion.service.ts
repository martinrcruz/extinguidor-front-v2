import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

export interface Facturacion {
  _id: string;
  ruta: {
    _id: string;
    name: {
      name: string;
    };
  };
  parte: {
    _id: string;
    description: string;
  };
  facturacion: number;
  createdDate: string;
}

export interface FacturacionResponse {
  facturacion: Facturacion[];
}
@Injectable({ providedIn: 'root' })
export class FacturacionService extends BaseService {
  private readonly endpoint = '/facturacion';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  getFacturacion() {
    return this.get<any>(this.endpoint);
  }

  getFacturacionById(id: string) {
    return this.get<any>(`${this.endpoint}/${id}`);
  }

  createFacturacion(facturacion: Partial<Facturacion>) {
    return this.post<any>(`${this.endpoint}/create`, facturacion);
  }

  updateFacturacion(id: string, facturacion: Partial<Facturacion>) {
    return this.put<any>(`${this.endpoint}/update/${id}`, facturacion);
  }

  deleteFacturacion(id: string) {
    return this.delete<any>(`${this.endpoint}/${id}`);
  }

  getFacturacionByRuta(rutaId: string) {
    return this.get<any>(`${this.endpoint}/ruta/${rutaId}`);
  }
}
