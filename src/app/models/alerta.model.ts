export interface Alerta {
    _id: string;
    state: 'Pendiente' | 'Cerrado';
    message: string;
    createdDate: Date;
} 