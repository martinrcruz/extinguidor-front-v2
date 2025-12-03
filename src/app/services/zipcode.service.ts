import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

export interface Zipcode {
  _id: string;
  id?: number;
  codezip: string;
  name?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface ZipcodesData {
  zipcodes: Zipcode[];
}

@Injectable({ providedIn: 'root' })
export class ZipcodesService extends BaseService {
  private readonly endpoint = '/zipcode';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todos los zipcodes
   * Retorna: { ok: true, data: { zipcodes: [...] } }
   */
  getZipcodes(): Observable<ApiResponse<ZipcodesData>> {
    return this.get<ZipcodesData>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data) {
          // Convertir ZipcodeResponse[] a Zipcode[] para compatibilidad
          const zipcodesRaw = response.data.zipcodes || [];
          const zipcodes: Zipcode[] = zipcodesRaw.map((z: any) => ({
            _id: z.id?.toString() || z._id,
            id: z.id,
            codezip: z.codezip,
            name: z.name,
            createdDate: z.createdDate,
            updatedDate: z.updatedDate
          }));
          
          return {
            ok: response.ok,
            data: { zipcodes },
            error: response.error,
            message: response.message
          };
        }
        return response;
      })
    );
  }

  /**
   * Crear zipcode
   * Retorna: { ok: true, data: { zipcode: {...} } }
   */
  createZipcode(payload: { codezip: string; name?: string }): Observable<ApiResponse<{ zipcode: Zipcode }>> {
    return this.post<{ zipcode: any }>(`${this.endpoint}/create`, payload).pipe(
      map(response => {
        if (response.ok && response.data?.zipcode) {
          const z = response.data.zipcode;
          const zipcode: Zipcode = {
            _id: z.id?.toString() || z._id,
            id: z.id,
            codezip: z.codezip,
            name: z.name,
            createdDate: z.createdDate,
            updatedDate: z.updatedDate
          };
          
          return {
            ok: response.ok,
            data: { zipcode },
            error: response.error,
            message: response.message
          };
        }
        return response;
      })
    );
  }
}
