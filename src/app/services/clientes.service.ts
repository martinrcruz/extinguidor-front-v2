import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';
import { CustomerResponse, CustomersData } from './customer.service';

// Mantener compatibilidad con interfaces antiguas
export interface Cliente {
  _id?: string;
  id?: number;
  name: string;
  email: string;
  nifCif: string;
  phone: string;
  address: string;
  zone?: {
    _id?: string;
    id?: number;
    name: string;
    code?: string;
  };
  tipo?: string;
  code?: string;
  contactName?: string;
  MI?: number;
  mi?: number;
  photo?: string;
}

export interface ClientesResponse {
  customers: Cliente[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService extends BaseService {
  private readonly endpoint = '/customers';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todos los clientes
   * Retorna: { ok: true, data: { customers: [...] } }
   */
  getCustomers(): Observable<ApiResponse<ClientesResponse>> {
    return this.get<CustomersData>(this.endpoint).pipe(
      map(response => {
        console.log('[ClientesService] Respuesta recibida del API:', response);
        console.log('[ClientesService] response.ok:', response.ok);
        console.log('[ClientesService] response.data:', response.data);
        console.log('[ClientesService] response.data?.customers:', response.data?.customers);
        
        // Convertir CustomerResponse[] a Cliente[] para compatibilidad
        const customersRaw = response.data?.customers || [];
        console.log('[ClientesService] customersRaw length:', customersRaw.length);
        
        const clientes: Cliente[] = customersRaw.map((c, index) => {
          const cliente = {
            _id: c.id?.toString(),
            id: c.id,
            name: c.name,
            email: c.email,
            nifCif: c.nifCif,
            phone: c.phone,
            address: c.address,
            zone: c.zone ? {
              _id: c.zone.id?.toString(),
              id: c.zone.id,
              name: c.zone.name,
              code: c.zone.code
            } : undefined,
            tipo: c.tipo,
            code: c.code,
            contactName: c.contactName,
            MI: c.mi,
            mi: c.mi,
            photo: c.photo
          };
          if (index === 0) {
            console.log('[ClientesService] Primer cliente mapeado:', cliente);
          }
          return cliente;
        });
        
        console.log('[ClientesService] Total clientes mapeados:', clientes.length);
        
        const result = {
          ok: response.ok,
          data: { customers: clientes },
          error: response.error,
          message: response.message
        };
        
        console.log('[ClientesService] Resultado final:', result);
        return result;
      })
    );
  }

  getCustomerById(id: string): Observable<any> {
    return this.get<{ customer: CustomerResponse }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.customer) {
          const c = response.data.customer;
          return {
            ok: true,
            data: {
              _id: c.id?.toString(),
              id: c.id,
              name: c.name,
              email: c.email,
              nifCif: c.nifCif,
              phone: c.phone,
              address: c.address,
              zone: c.zone ? {
                _id: c.zone.id?.toString(),
                id: c.zone.id,
                name: c.zone.name,
                code: c.zone.code
              } : undefined,
              tipo: c.tipo,
              code: c.code,
              contactName: c.contactName,
              MI: c.mi,
              mi: c.mi,
              photo: c.photo
            }
          };
        }
        throw new Error(response.error || 'Error al obtener el cliente');
      })
    );
  }

  createCustomer(customer: any): Observable<any> {
    return this.post<{ customer: CustomerResponse }>(`${this.endpoint}/create`, customer).pipe(
      map(response => {
        if (response.ok && response.data?.customer) {
          const c = response.data.customer;
          return {
            ok: true,
            data: {
              _id: c.id?.toString(),
              id: c.id,
              name: c.name,
              email: c.email,
              nifCif: c.nifCif,
              phone: c.phone,
              address: c.address,
              zone: c.zone,
              tipo: c.tipo,
              code: c.code,
              contactName: c.contactName,
              MI: c.mi,
              mi: c.mi,
              photo: c.photo
            }
          };
        }
        throw new Error(response.error || 'Error al crear el cliente');
      })
    );
  }

  updateCustomer(id: string, customer: any): Observable<any> {
    return this.put<{ customer: CustomerResponse }>(`${this.endpoint}/update/${id}`, customer).pipe(
      map(response => {
        if (response.ok && response.data?.customer) {
          const c = response.data.customer;
          return {
            ok: true,
            data: {
              _id: c.id?.toString(),
              id: c.id,
              name: c.name,
              email: c.email,
              nifCif: c.nifCif,
              phone: c.phone,
              address: c.address,
              zone: c.zone,
              tipo: c.tipo,
              code: c.code,
              contactName: c.contactName,
              MI: c.mi,
              mi: c.mi,
              photo: c.photo
            }
          };
        }
        throw new Error(response.error || 'Error al actualizar el cliente');
      })
    );
  }

  deleteCustomer(id: string): Observable<ApiResponse<any>> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => ({
        ok: response.ok || false,
        data: response.data,
        error: response.error,
        message: response.message
      }))
    );
  }
} 