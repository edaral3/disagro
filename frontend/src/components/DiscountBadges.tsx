'use client';

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface DiscountBadgesProps {
  servicesDiscountPct: number;
  productsDiscountPct: number;
}

function Badge({ label, pct }: { label: string; pct: number }) {
  return (
    <Box
      sx={{
        flex: 1,
        textAlign: 'center',
        py: 1.5,
        px: 1,
        borderRadius: 1,
        bgcolor: pct > 0 ? 'success.main' : 'action.disabledBackground',
        color: pct > 0 ? 'success.contrastText' : 'text.secondary',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
        {label}
      </Typography>
      <Typography variant="h5" component="p" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
        {pct}%
      </Typography>
    </Box>
  );
}

export function DiscountBadges({ servicesDiscountPct, productsDiscountPct }: DiscountBadgesProps) {
  return (
    <Stack direction="row" spacing={2}>
      <Badge label="Descuento obtenido en Servicios" pct={servicesDiscountPct} />
      <Badge label="Descuento obtenido en Productos" pct={productsDiscountPct} />
    </Stack>
  );
}
