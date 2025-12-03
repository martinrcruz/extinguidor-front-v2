import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';

export interface VehicleResponse {
  id: number;
  modelo: string;
  brand: string;
  matricula: string;
  fuel?: string;
  type?: string;
  photo?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface VehiclesData {
  vehicles: VehicleResponse[];
}

export interface VehicleData {
  vehicle: VehicleResponse;
}

// Mantener compatibilidad con interfaz antigua
export interface Vehicle {
  _id?: string;
  id?: number;
  brand: string;
  modelo: string;
  matricula: string;
  fuel: string;
  type: string;
  photo?: string;
  lastMaintenance?: Date;
  kilometraje?: number;
  assignedTo?: {
    _id: string;
    name: string;
  };
  status?: string;
  eliminado?: boolean;
  createdDate?: string;
  __v?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehiculosService extends BaseService {
  private readonly endpoint = '/vehicle';

  constructor(
    http: HttpClient,
    authService: AuthService
  ) {
    super(http, authService);
  }

  /**
   * Obtener todos los vehículos (GET /vehicle)
   * Retorna: { ok: true, data: { vehicles: [...] } }
   */
  getVehicles(): Observable<Vehicle[]> {
    return this.get<VehiclesData>(this.endpoint).pipe(
      map(response => {
        if (response.ok && response.data?.vehicles) {
          // Convertir VehicleResponse[] a Vehicle[] para compatibilidad
          return response.data.vehicles.map(v => ({
            _id: v.id?.toString(),
            id: v.id,
            brand: v.brand,
            modelo: v.modelo,
            matricula: v.matricula,
            fuel: v.fuel || '',
            type: v.type || '',
            photo: v.photo,
            createdDate: v.createdDate
          } as Vehicle));
        }
        throw new Error(response.error || 'Error al obtener los vehículos');
      })
    );
  }

  /**
   * Crear vehículo (POST /vehicle/create)
   * Retorna: { ok: true, data: { vehicle: {...} } }
   */
  createVehicle(data: Partial<Vehicle>): Observable<Vehicle> {
    return this.post<VehicleData>(`${this.endpoint}/create`, data).pipe(
      map(response => {
        if (response.ok && response.data?.vehicle) {
          const v = response.data.vehicle;
          return {
            _id: v.id?.toString(),
            id: v.id,
            brand: v.brand,
            modelo: v.modelo,
            matricula: v.matricula,
            fuel: v.fuel || '',
            type: v.type || '',
            photo: v.photo,
            createdDate: v.createdDate
          } as Vehicle;
        }
        throw new Error(response.error || 'Error al crear el vehículo');
      })
    );
  }

  /**
   * Obtener vehículo por ID (GET /vehicle/:id)
   * Retorna: { ok: true, data: { vehicle: {...} } }
   */
  getVehicleById(id: string): Observable<Vehicle> {
    return this.get<VehicleData>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok && response.data?.vehicle) {
          const v = response.data.vehicle;
          return {
            _id: v.id?.toString(),
            id: v.id,
            brand: v.brand,
            modelo: v.modelo,
            matricula: v.matricula,
            fuel: v.fuel || '',
            type: v.type || '',
            photo: v.photo,
            createdDate: v.createdDate
          } as Vehicle;
        }
        throw new Error(response.error || 'Error al obtener el vehículo');
      })
    );
  }

  /**
   * Actualizar vehículo (PUT /vehicle/update/:id)
   * Retorna: { ok: true, data: { vehicle: {...} } }
   */
  updateVehicle(id: string, data: Partial<Vehicle>): Observable<Vehicle> {
    return this.put<VehicleData>(`${this.endpoint}/update/${id}`, data).pipe(
      map(response => {
        if (response.ok && response.data?.vehicle) {
          const v = response.data.vehicle;
          return {
            _id: v.id?.toString(),
            id: v.id,
            brand: v.brand,
            modelo: v.modelo,
            matricula: v.matricula,
            fuel: v.fuel || '',
            type: v.type || '',
            photo: v.photo,
            createdDate: v.createdDate
          } as Vehicle;
        }
        throw new Error(response.error || 'Error al actualizar el vehículo');
      })
    );
  }

  /**
   * Eliminar vehículo (DELETE /vehicle/:id)
   * Retorna: { ok: true, data: { message: "..." } }
   */
  deleteVehicle(id: string): Observable<void> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`).pipe(
      map(response => {
        if (response.ok) {
          return;
        }
        throw new Error(response.error || 'Error al eliminar el vehículo');
      })
    );
  }
} 