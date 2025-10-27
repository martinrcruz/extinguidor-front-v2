export interface Parte {
  _id: string;
  title: string;
  description: string;
  address: string;
  facturacion: number;
  state: string;
  type: string;
  categoria: string;
  asignado: boolean;
  periodico: boolean;
  frequency?: string;
  endDate?: string;
  date: string;
  zone: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    nifCif: string;
    address: string;
    zone: string;
    phone: string;
    contactName: string;
    code: string;
    photo: string;
  };
  ruta?: any;
  coordinationMethod: string;
  gestiona: number;
  articulos?: any[];
  selected?: boolean;
} 