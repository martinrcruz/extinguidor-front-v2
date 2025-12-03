import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { BaseService } from './base.service';

export interface Material {
  _id?: string;
  id?: number;
  name: string;
  code?: string;
  description?: string;
  type?: string;
  state?: string;
  eliminado?: boolean;
}

export interface MaterialParte {
  _id?: string;
  material: Material;
  cantidad: number;
  ruta: string;
  eliminado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialesService extends BaseService {
  private readonly endpoint = '/material';
  private readonly materialParteEndpoint = '/materialparte';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  getMaterials(): Observable<Material[]> {
    return this.get<Material[]>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data) {
          // El backend devuelve List<MaterialResponse> directamente en data
          const materials = Array.isArray(response.data) ? response.data : [];
          // Mapear MaterialResponse (con id) a Material (con _id e id)
          return materials.map((m: any) => ({
            _id: m.id?.toString(),
            id: m.id,
            name: m.name,
            code: m.code,
            description: m.description,
            type: m.type,
            state: m.state,
            eliminado: m.eliminado
          } as Material));
        }
        throw new Error(response.error || 'Error al obtener los materiales');
      })
    );
  }

  createMaterial(data: Partial<Material>): Observable<Material> {
    return this.post<{ material: Material }>(`${this.endpoint}/create`, data).pipe(
      map(response => {
        if (response.ok && response.data?.material) {
          return response.data.material;
        }
        throw new Error(response.error || 'Error al crear el material');
      })
    );
  }

  getMaterialById(id: string): Observable<Material> {
    return this.get<{ material: Material }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.material) {
          return response.data.material;
        }
        throw new Error(response.error || 'Error al obtener el material');
      })
    );
  }

  updateMaterial(id: string, data: Partial<Material>): Observable<Material> {
    return this.put<{ material: Material }>(`${this.endpoint}/update/${id}`, data).pipe(
      map(response => {
        if (response.ok && response.data?.material) {
          return response.data.material;
        }
        throw new Error(response.error || 'Error al actualizar el material');
      })
    );
  }

  deleteMaterial(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar el material');
      })
    );
  }

  getMaterialPartes(): Observable<MaterialParte[]> {
    return this.get<{ materialPartes: MaterialParte[] }>(this.materialParteEndpoint).pipe(
      map(response => {
        if (response.ok && response.data?.materialPartes) {
          return response.data.materialPartes;
        }
        throw new Error(response.error || 'Error al obtener los materiales de parte');
      })
    );
  }

  createMaterialParte(data: Partial<MaterialParte>): Observable<MaterialParte> {
    return this.post<{ materialParte: MaterialParte }>(`${this.materialParteEndpoint}/create`, data).pipe(
      map(response => {
        if (response.ok && response.data?.materialParte) {
          return response.data.materialParte;
        }
        throw new Error(response.error || 'Error al crear el material de parte');
      })
    );
  }

  getMaterialParteByRuta(rutaId: string): Observable<MaterialParte[]> {
    return this.get<{ materialPartes: MaterialParte[] }>(`${this.materialParteEndpoint}/${rutaId}`).pipe(
      map(response => {
        if (response.ok && response.data?.materialPartes) {
          return response.data.materialPartes;
        }
        throw new Error(response.error || 'Error al obtener los materiales de parte por ruta');
      })
    );
  }
} 