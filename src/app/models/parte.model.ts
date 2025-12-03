import { Ruta } from "./ruta.model";

export interface Cliente {
  _id: string;
  name: string;
  email: string;
  nifCif: string;
  phone: string;
  address: string;
  zone?: {
    _id: string;
    name: string;
  };
  tipo?: string;
  code?: string;
  contactName?: string;
  MI?: number;
  photo?: string;
}

export interface Parte {
  _id?: string;
  id?: number;
  title: string;
  description: string;
  date: string | Date;
  state: 'Pendiente' | 'EnProceso' | 'Finalizado' | 'Cancelado';
  type: 'Obra' | 'Mantenimiento' | 'Correctivo' | 'Visitas';
  categoria: 'Extintores' | 'Incendio' | 'Robo' | 'CCTV' | 'Pasiva' | 'Venta';
  asignado: boolean;
  eliminado?: boolean;
  customer: Cliente | string;
  ruta?: Ruta | string;
  address: string;
  periodico: boolean;
  frequency?: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';
  endDate?: string | Date;
  coordinationMethod: string;
  gestiona: number;
  finalizadoTime?: Date;
  facturacion: number;
  comentarios?: Array<{
    texto: string;
    fecha: Date;
    usuario: string;
  }>;
  documentos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
    fecha: Date;
  }>;
  articulos?: Array<{
    cantidad: number;
    codigo: string;
    grupo: string;
    familia: string;
    descripcionArticulo: string;
    precioVenta: number;
  }>;
  createdDate?: Date;
  updatedDate?: Date;
  selected?: boolean; // Para uso en UI
}
