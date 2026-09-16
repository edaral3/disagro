'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { PersonalInfoValues } from '@/lib/registration-schema';

interface PersonalInfoFieldsProps {
  register: UseFormRegister<PersonalInfoValues>;
  errors: FieldErrors<PersonalInfoValues>;
}

export function PersonalInfoFields({ register, errors }: PersonalInfoFieldsProps) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h6" component="h2">
        1. Ingrese su información
      </Typography>

      <TextField
        label="Nombre"
        placeholder="Introduzca su nombre"
        fullWidth
        {...register('firstName')}
        error={!!errors.firstName}
        helperText={errors.firstName?.message}
      />

      <TextField
        label="Apellidos"
        placeholder="Introduzca sus apellidos"
        fullWidth
        {...register('lastName')}
        error={!!errors.lastName}
        helperText={errors.lastName?.message}
      />

      <TextField
        label="Email"
        type="email"
        placeholder="Introduzca su Email"
        fullWidth
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
      />

      <TextField
        label="Fecha y Hora"
        type="datetime-local"
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
        {...register('eventDateTime')}
        error={!!errors.eventDateTime}
        helperText={errors.eventDateTime?.message ?? 'Seleccione fecha y hora en que asistirá'}
      />
    </Stack>
  );
}
