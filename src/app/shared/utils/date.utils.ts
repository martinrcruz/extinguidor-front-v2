/**
 * Utilidades para el manejo de fechas sin problemas de zona horaria
 * 
 * Estas funciones aseguran que las fechas se manejen de forma consistente
 * entre el backend y el frontend, evitando problemas de desfase de un día
 * causados por diferencias de zona horaria.
 */

/**
 * Extrae solo la parte de fecha (YYYY-MM-DD) de una fecha ISO o Date
 * sin considerar la zona horaria. Útil cuando el backend envía fechas
 * en formato ISO UTC pero queremos trabajar solo con la fecha.
 * 
 * @param dateInput - Puede ser un string ISO (ej: "2025-10-29T00:00:00.000Z")
 *                    o un objeto Date
 * @returns String en formato YYYY-MM-DD
 * 
 * @example
 * isoDateOnly("2025-10-29T00:00:00.000Z") // "2025-10-29"
 * isoDateOnly(new Date("2025-10-29T00:00:00.000Z")) // "2025-10-29"
 */
export function isoDateOnly(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  
  let dateStr: string;
  
  if (typeof dateInput === 'string') {
    // Si es un string ISO, extraer solo la parte de fecha (YYYY-MM-DD)
    // antes de la 'T' o del espacio
    dateStr = dateInput.split('T')[0].split(' ')[0];
  } else if (dateInput instanceof Date) {
    // Si es un objeto Date, extraer año, mes y día directamente
    // sin considerar la zona horaria
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  } else {
    return '';
  }
  
  return dateStr;
}

/**
 * Convierte una fecha ISO o Date a un objeto Date local
 * parseando solo la parte de fecha (YYYY-MM-DD) sin considerar la zona horaria.
 * Esto evita que fechas como "2025-10-29T00:00:00.000Z" se muestren
 * como un día anterior en zonas horarias detrás de UTC.
 * 
 * @param dateInput - Puede ser un string ISO o un objeto Date
 * @returns Date objeto parseado como fecha local (medianoche)
 * 
 * @example
 * parseDateAsLocal("2025-10-29T00:00:00.000Z") // Date para 2025-10-29 00:00:00 local
 */
export function parseDateAsLocal(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  
  let dateStr: string;
  
  if (typeof dateInput === 'string') {
    // Extraer solo la parte de fecha (YYYY-MM-DD)
    dateStr = dateInput.split('T')[0].split(' ')[0];
  } else if (dateInput instanceof Date) {
    // Si ya es un Date, extraer año, mes y día
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  } else {
    return null;
  }
  
  // Parsear como fecha local (no UTC) para evitar problemas de timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  
  return date;
}

/**
 * Formatea una fecha para mostrarla en formato dd/MM/yyyy
 * sin problemas de zona horaria.
 * 
 * @param dateInput - Puede ser un string ISO o un objeto Date
 * @returns String en formato dd/MM/yyyy
 * 
 * @example
 * formatDateLocal("2025-10-29T00:00:00.000Z") // "29/10/2025"
 */
export function formatDateLocal(dateInput: string | Date | null | undefined): string {
  const date = parseDateAsLocal(dateInput);
  if (!date) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}


