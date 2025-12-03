import { MaterialCategory } from './material-category.enum';

export interface Herramienta {
  _id?: string;
  id?: number;
  name: string;
  code: string;
  description?: string;
  type?: string;
  fechaUltimoMantenimiento?: string | Date;
  color?: string;
  categoria?: MaterialCategory;
  createdDate?: Date;
  updatedDate?: Date;
}

