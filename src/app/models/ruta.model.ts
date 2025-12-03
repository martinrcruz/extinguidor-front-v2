export interface Ruta {
  _id: string;
  id:string;
  name: {
    _id: string;
    name: string;
    __v: number;
  };
  type: string;
  state: string;
  date: string;
  encargado:{
    _id: string;
    name: string;
    code: string;
    photo: string;
    role: string;
    email: string;
    phone: string;
    activo: boolean;
    junior: boolean;
    __v: number;
  };
  users: Array<{
    _id: string;
    name: string;
    code: string;
    photo: string;
    role: string;
    email: string;
    phone: string;
    activo: boolean;
    junior: boolean;
    __v: number;
  }>;
  vehicle: {
    _id: string;
    fuel: string;
    type: string;
    modelo: string;
    brand: string;
    photo: string;
    matricula: string;
    createdDate: string;
    __v: number;
  };
  comentarios: string;
  herramientas: any[];
  eliminado: boolean;
  __v: number;
  expanded?: boolean;
} 