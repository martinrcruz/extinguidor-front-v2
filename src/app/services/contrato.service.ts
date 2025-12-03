import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ContratoService extends BaseService {
  private readonly endpoint = '/contract';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  getContracts(): Observable<any[]> {
    return this.get<{ contracts: any[] }>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data?.contracts) {
          return response.data.contracts;
        }
        throw new Error(response.error || 'Error al obtener los contratos');
      })
    );
  }

  getContractById(id: string): Observable<any> {
    return this.get<{ contract: any }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.contract) {
          return response.data.contract;
        }
        throw new Error(response.error || 'Error al obtener el contrato');
      })
    );
  }

  createContract(contract: any): Observable<any> {
    return this.post<{ contract: any }>(this.endpoint, contract).pipe(
      map(response => {
        if (response.ok && response.data?.contract) {
          return response.data.contract;
        }
        throw new Error(response.error || 'Error al crear el contrato');
      })
    );
  }

  updateContract(id: string, contract: any): Observable<any> {
    return this.put<{ contract: any }>(`${this.endpoint}/${id}`, contract).pipe(
      map(response => {
        if (response.ok && response.data?.contract) {
          return response.data.contract;
        }
        throw new Error(response.error || 'Error al actualizar el contrato');
      })
    );
  }

  deleteContract(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar el contrato');
      })
    );
  }
}
