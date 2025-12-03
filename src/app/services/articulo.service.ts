import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';

export interface ArticleResponse {
  id: number;
  cantidad: number;
  codigo: string;
  grupo: string;
  familia: string;
  descripcionArticulo: string;
  precioVenta: number;
  createdDate?: string;
  updatedDate?: string;
  eliminado?: boolean;
}

export interface ArticlesData {
  articulos: ArticleResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ArticleData {
  articulo: ArticleResponse;
}

// Mantener compatibilidad con interfaz antigua
export interface Articulo {
  _id?: string;
  id?: number;
  cantidad: number;
  codigo: string;
  grupo: string;
  familia: string;
  descripcionArticulo: string;
  precioVenta: number;
  createdDate?: Date;
  updatedDate?: Date;
  eliminado?: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ArticulosResponse {
  ok: boolean;
  articulos: Articulo[];
  pagination: PaginationInfo;
}

@Injectable({
  providedIn: 'root'
})
export class ArticuloService extends BaseService {
  private readonly endpoint = '/articulos';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todos los artículos (GET /articulos?page=1&limit=100&search=&grupo=&familia=)
   * Retorna: { ok: true, data: { articulos: [...], pagination: {...} } }
   */
  getArticulos(page: number = 1, limit: number = 100, search: string = '', grupo: string = '', familia: string = ''): Observable<ArticulosResponse> {
    let url = `${this.endpoint}?page=${page}&limit=${limit}`;

    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    if (grupo.trim()) {
      url += `&grupo=${encodeURIComponent(grupo.trim())}`;
    }
    if (familia.trim()) {
      url += `&familia=${encodeURIComponent(familia.trim())}`;
    }

    return this.get<ArticlesData>(url).pipe(
      map(response => {
        if (response.ok && response.data) {
          // Convertir ArticleResponse[] a Articulo[] para compatibilidad
          const articulos: Articulo[] = response.data.articulos.map(a => ({
            _id: a.id?.toString(),
            id: a.id,
            cantidad: a.cantidad,
            codigo: a.codigo,
            grupo: a.grupo,
            familia: a.familia,
            descripcionArticulo: a.descripcionArticulo,
            precioVenta: a.precioVenta,
            createdDate: a.createdDate ? new Date(a.createdDate) : undefined,
            updatedDate: a.updatedDate ? new Date(a.updatedDate) : undefined,
            eliminado: a.eliminado
          }));
          
          return {
            ok: true,
            articulos,
            pagination: response.data.pagination
          };
        }
        throw new Error(response.error || 'Error al obtener los artículos');
      })
    );
  }

  /**
   * Crear artículo (POST /articulos)
   * Retorna: { ok: true, data: { articulo: {...} } }
   */
  createArticulo(data: Partial<Articulo>): Observable<Articulo> {
    return this.post<ArticleData>(this.endpoint, data).pipe(
      map(response => {
        if (response.ok && response.data?.articulo) {
          const a = response.data.articulo;
          return {
            _id: a.id?.toString(),
            id: a.id,
            cantidad: a.cantidad,
            codigo: a.codigo,
            grupo: a.grupo,
            familia: a.familia,
            descripcionArticulo: a.descripcionArticulo,
            precioVenta: a.precioVenta,
            createdDate: a.createdDate ? new Date(a.createdDate) : undefined,
            updatedDate: a.updatedDate ? new Date(a.updatedDate) : undefined,
            eliminado: a.eliminado
          } as Articulo;
        }
        throw new Error(response.error || 'Error al crear el artículo');
      })
    );
  }

  /**
   * Obtener artículo por ID (GET /articulos/:id)
   * Retorna: { ok: true, data: { articulo: {...} } }
   */
  getArticuloById(id: string): Observable<Articulo> {
    return this.get<ArticleData>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.articulo) {
          const a = response.data.articulo;
          return {
            _id: a.id?.toString(),
            id: a.id,
            cantidad: a.cantidad,
            codigo: a.codigo,
            grupo: a.grupo,
            familia: a.familia,
            descripcionArticulo: a.descripcionArticulo,
            precioVenta: a.precioVenta,
            createdDate: a.createdDate ? new Date(a.createdDate) : undefined,
            updatedDate: a.updatedDate ? new Date(a.updatedDate) : undefined,
            eliminado: a.eliminado
          } as Articulo;
        }
        throw new Error(response.error || 'Error al obtener el artículo');
      })
    );
  }

  /**
   * Actualizar artículo (PUT /articulos/:id)
   * Retorna: { ok: true, data: { articulo: {...} } }
   */
  updateArticulo(id: string, data: Partial<Articulo>): Observable<Articulo> {
    return this.put<ArticleData>(`${this.endpoint}/${id}`, data).pipe(
      map(response => {
        if (response.ok && response.data?.articulo) {
          const a = response.data.articulo;
          return {
            _id: a.id?.toString(),
            id: a.id,
            cantidad: a.cantidad,
            codigo: a.codigo,
            grupo: a.grupo,
            familia: a.familia,
            descripcionArticulo: a.descripcionArticulo,
            precioVenta: a.precioVenta,
            createdDate: a.createdDate ? new Date(a.createdDate) : undefined,
            updatedDate: a.updatedDate ? new Date(a.updatedDate) : undefined,
            eliminado: a.eliminado
          } as Articulo;
        }
        throw new Error(response.error || 'Error al actualizar el artículo');
      })
    );
  }

  /**
   * Eliminar artículo (DELETE /articulos/:id)
   * Retorna: { ok: true, data: { message: "..." } }
   */
  deleteArticulo(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar el artículo');
      })
    );
  }
} 