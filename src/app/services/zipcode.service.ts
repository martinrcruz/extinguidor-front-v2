import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

export interface Zona {
  _id: string;
  name: string;
  description?: string;
}

export interface ZonasResponse {
  zones: Zona[];
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

  getZipcodes() {
    return this.get<any>(this.endpoint);
  }

  createZipcode(payload: { codezip: string; name?: string }) {
    return this.post<any>(`${this.endpoint}/create`, payload);
  }
}
