import { ValueTransformer } from 'typeorm';

/**
 * TypeORM devuelve columnas `decimal` como string (para no perder precisión),
 * aunque la entidad las tipe como `number`. Este transformer normaliza la
 * conversión en ambas direcciones para que el valor en memoria sea siempre
 * un number real, evitando conversiones defensivas dispersas por el código.
 */
export const DecimalTransformer: ValueTransformer = {
  to: (value: number): number => value,
  from: (value: string | null): number | null =>
    value === null ? null : parseFloat(value),
};
