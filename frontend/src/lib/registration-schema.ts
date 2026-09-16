import { z } from 'zod';

/**
 * Validación de cliente para feedback inmediato por campo. La validación
 * autoritativa sigue siendo la del backend (ver CreateRegistrationDto en
 * backend/src/registrations/dto/create-registration.dto.ts); los mensajes
 * de error 400/409 del servidor se muestran tal cual llegan.
 */
export const personalInfoSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
  email: z.string().trim().min(1, 'El email es requerido').email('Ingresa un email válido'),
  eventDateTime: z
    .string()
    .min(1, 'Selecciona la fecha y hora en que asistirás')
    .refine((val) => !Number.isNaN(new Date(val).getTime()), 'Fecha inválida')
    .refine((val) => new Date(val).getTime() > Date.now(), 'Debe ser una fecha futura'),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
