import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';

export interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  nifCif: string;
  address: string;
  phone: string;
  contactName: string;
  code: string;
  active?: boolean;
  zone?: {
    id: number;
    name: string;
    code: string;
  };
  description?: string;
  gestiona?: string;
  photo?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  contractSystems?: string[];
  averageTime?: number;
  delegation?: string;
  revisionFrequency?: string;
  rate?: string;
  mi?: number;
  tipo?: string;
  total?: number;
  documents?: Array<{
    name: string;
    url: string;
  }>;
  createdDate?: string;
  updatedDate?: string;
}

export interface CustomersData {
  customers: CustomerResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService extends BaseService {
  private readonly endpoint = '/customers';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todos los clientes (GET /customers)
   * Retorna: { ok: true, data: { customers: [...] } }
   */
  getCustomers(): Observable<CustomerResponse[]> {
    console.log('[CustomerService.getCustomers] Iniciando petición a:', this.endpoint);
    return this.get<CustomersData>(this.endpoint).pipe(
      map(response => {
        console.log('[CustomerService.getCustomers] Respuesta completa:', response);
        console.log('[CustomerService.getCustomers] response.ok:', response.ok);
        console.log('[CustomerService.getCustomers] response.data:', response.data);
        console.log('[CustomerService.getCustomers] response.data?.customers:', response.data?.customers);
        
        if (response.ok && response.data?.customers) {
          console.log('[CustomerService.getCustomers] Clientes encontrados:', response.data.customers.length);
          return response.data.customers;
        }
        
        console.error('[CustomerService.getCustomers] Respuesta inválida:', {
          ok: response.ok,
          hasData: !!response.data,
          hasCustomers: !!response.data?.customers,
          error: response.error
        });
        throw new Error(response.error || 'Error al obtener los clientes');
      }),
      catchError(error => {
        console.error('[CustomerService.getCustomers] Error capturado:', error);
        console.error('[CustomerService.getCustomers] Error tipo:', typeof error);
        console.error('[CustomerService.getCustomers] Error mensaje:', error?.message || error);
        // Retornar array vacío en caso de error para que el componente no falle
        return of([]);
      })
    );
  }

  /**
   * Crear cliente (POST /customers/create)
   * Retorna: { ok: true, data: { customer: {...} } }
   */
  createCustomer(data: any): Observable<CustomerResponse> {
    return this.post<{ customer: CustomerResponse }>(`${this.endpoint}/create`, data).pipe(
      map(response => {
        if (response.ok && response.data?.customer) {
          return response.data.customer;
        }
        throw new Error(response.error || 'Error al crear el cliente');
      })
    );
  }

  /**
   * Obtener cliente por ID (GET /customers/:id)
   * Retorna: { ok: true, data: { customer: {...} } }
   */
  getCustomerById(id: string): Observable<CustomerResponse> {
    return this.get<{ customer: CustomerResponse }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.customer) {
          return response.data.customer;
        }
        throw new Error(response.error || 'Error al obtener el cliente');
      })
    );
  }

  /**
   * Actualizar cliente (PUT /customers/update/:id)
   * Retorna: { ok: true, data: { customer: {...} } }
   */
  updateCustomer(id: string, data: any): Observable<CustomerResponse> {
    return this.put<{ customer: CustomerResponse }>(`${this.endpoint}/update/${id}`, data).pipe(
      map(response => {
        if (response.ok && response.data?.customer) {
          return response.data.customer;
        }
        throw new Error(response.error || 'Error al actualizar el cliente');
      })
    );
  }

  /**
   * Eliminar cliente (DELETE /customers/:id)
   * Retorna: { ok: true, data: { message: "..." } }
   */
  deleteCustomer(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar el cliente');
      })
    );
  }
}
