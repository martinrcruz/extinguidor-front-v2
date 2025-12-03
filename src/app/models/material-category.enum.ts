export enum MaterialCategory {
  HERRAMIENTA_ELECTRICA = 'HERRAMIENTA_ELECTRICA',
  HERRAMIENTA_MANUAL = 'HERRAMIENTA_MANUAL',
  HERRAMIENTA_NEUMATICA = 'HERRAMIENTA_NEUMATICA',
  MATERIAL_SEGURIDAD = 'MATERIAL_SEGURIDAD',
  MATERIAL_LIMPIEZA = 'MATERIAL_LIMPIEZA',
  MATERIAL_CONSTRUCCION = 'MATERIAL_CONSTRUCCION',
  MATERIAL_ELECTRICO = 'MATERIAL_ELECTRICO',
  MATERIAL_FONTANERIA = 'MATERIAL_FONTANERIA',
  MATERIAL_CARPINTERIA = 'MATERIAL_CARPINTERIA',
  MATERIAL_PINTURA = 'MATERIAL_PINTURA',
  EQUIPO_PROTECCION = 'EQUIPO_PROTECCION',
  OTROS = 'OTROS'
}

export const MaterialCategoryLabels: { [key in MaterialCategory]: string } = {
  [MaterialCategory.HERRAMIENTA_ELECTRICA]: 'Herramienta Eléctrica',
  [MaterialCategory.HERRAMIENTA_MANUAL]: 'Herramienta Manual',
  [MaterialCategory.HERRAMIENTA_NEUMATICA]: 'Herramienta Neumática',
  [MaterialCategory.MATERIAL_SEGURIDAD]: 'Material de Seguridad',
  [MaterialCategory.MATERIAL_LIMPIEZA]: 'Material de Limpieza',
  [MaterialCategory.MATERIAL_CONSTRUCCION]: 'Material de Construcción',
  [MaterialCategory.MATERIAL_ELECTRICO]: 'Material Eléctrico',
  [MaterialCategory.MATERIAL_FONTANERIA]: 'Material de Fontanería',
  [MaterialCategory.MATERIAL_CARPINTERIA]: 'Material de Carpintería',
  [MaterialCategory.MATERIAL_PINTURA]: 'Material de Pintura',
  [MaterialCategory.EQUIPO_PROTECCION]: 'Equipo de Protección',
  [MaterialCategory.OTROS]: 'Otros'
};

