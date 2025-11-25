import { Pipe, PipeTransform } from '@angular/core';
import { parseDateAsLocal } from '../utils/date.utils';

/**
 * Pipe personalizado para formatear fechas sin problemas de zona horaria.
 * 
 * Este pipe parsea fechas ISO (como "2025-10-29T00:00:00.000Z") como fechas locales
 * antes de formatearlas, evitando que se muestren con un día de diferencia.
 * 
 * @example
 * {{ fechaISO | dateLocal:'dd/MM/yyyy' }}
 * {{ ruta.date | dateLocal:'dd/MM/yyyy' }}
 */
@Pipe({
  name: 'dateLocal',
  standalone: true
})
export class DateLocalPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: string = 'dd/MM/yyyy'): string {
    if (!value) return '';
    
    // Parsear la fecha como fecha local (sin considerar zona horaria)
    const date = parseDateAsLocal(value);
    if (!date) return '';
    
    // Formatear según el formato solicitado
    // Soporte básico para formatos comunes
    if (format === 'dd/MM/yyyy') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } else if (format === 'yyyy-MM-dd') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    } else if (format === 'dd-MM-yyyy') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // Para otros formatos, usar el pipe date de Angular con la fecha parseada
    // pero necesitamos importar DatePipe o usar una librería de formateo
    // Por ahora, retornamos el formato básico
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

