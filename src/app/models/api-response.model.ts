/**
 * Interfaz que coincide con StandardApiResponse del backend
 * Campos adicionales opcionales para compatibilidad con respuestas especiales (ej: login)
 */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  // Campos adicionales opcionales para casos especiales (ej: login)
  token?: string;
  user?: any;
  total?: number;
  page?: number;
  limit?: number;
} 