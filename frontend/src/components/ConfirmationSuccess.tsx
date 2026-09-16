'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DiscountBadges } from './DiscountBadges';
import type { RegistrationResponse } from '@/types/api';

interface ConfirmationSuccessProps {
  registration: RegistrationResponse;
  onReset: () => void;
}

export function ConfirmationSuccess({ registration, onReset }: ConfirmationSuccessProps) {
  return (
    <Paper variant="outlined" sx={{ p: 4, maxWidth: 520, mx: 'auto', textAlign: 'center' }}>
      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />

        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            ¡Asistencia confirmada!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gracias, {registration.firstName}. Hemos preparado tu portafolio de
            promociones personalizado para el evento.
          </Typography>
        </Box>

        <Box sx={{ width: '100%' }}>
          <DiscountBadges
            servicesDiscountPct={registration.servicesDiscountPct}
            productsDiscountPct={registration.productsDiscountPct}
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {registration.items.length} ítem(s) seleccionado(s) · Confirmación #
          {registration.id.slice(0, 8)}
        </Typography>

        <Button variant="outlined" onClick={onReset}>
          Confirmar otra asistencia
        </Button>
      </Stack>
    </Paper>
  );
}
