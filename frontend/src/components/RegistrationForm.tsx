'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PersonalInfoFields } from './PersonalInfoFields';
import { ItemsPicker } from './ItemsPicker';
import { DiscountBadges } from './DiscountBadges';
import { ConfirmationSuccess } from './ConfirmationSuccess';
import { personalInfoSchema, type PersonalInfoValues } from '@/lib/registration-schema';
import { calculateDiscountPreview } from '@/lib/discount';
import { useCreateRegistration } from '@/hooks/useCreateRegistration';
import { ApiError } from '@/api/client';
import type { Item, RegistrationResponse } from '@/types/api';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'Ya existe una confirmación de asistencia con ese email.';
    }
    if (error.status === 401) {
      return 'Tu sesión expiró y no se pudo renovar. Recarga la página e intenta de nuevo.';
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export function RegistrationForm() {
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [itemsTouched, setItemsTouched] = useState(false);
  const [confirmedRegistration, setConfirmedRegistration] =
    useState<RegistrationResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
  });

  const mutation = useCreateRegistration({
    onSuccess: (data) => setConfirmedRegistration(data),
  });

  const discountPreview = useMemo(
    () =>
      calculateDiscountPreview(
        selectedItems.map((i) => ({ id: i.id, type: i.type, price: i.price })),
      ),
    [selectedItems],
  );

  function toggleItem(item: Item) {
    setItemsTouched(true);
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item],
    );
  }

  function handleReset() {
    reset();
    setSelectedItems([]);
    setItemsTouched(false);
    setConfirmedRegistration(null);
    mutation.reset();
  }

  function onSubmit(values: PersonalInfoValues) {
    setItemsTouched(true);
    if (selectedItems.length === 0) return;

    mutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      eventDateTime: new Date(values.eventDateTime).toISOString(),
      selectedItemIds: selectedItems.map((i) => i.id),
    });
  }

  if (confirmedRegistration) {
    return <ConfirmationSuccess registration={confirmedRegistration} onReset={handleReset} />;
  }

  const showNoItemsError = itemsTouched && selectedItems.length === 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Grid container spacing={4} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid size={{ xs: 12, md: 6 }}>
          <PersonalInfoFields register={register} errors={errors} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2.5}>
            <ItemsPicker selectedItems={selectedItems} onToggle={toggleItem} />

            {showNoItemsError && (
              <Alert severity="warning">Selecciona al menos un servicio o producto.</Alert>
            )}

            <DiscountBadges
              servicesDiscountPct={discountPreview.servicesDiscountPct}
              productsDiscountPct={discountPreview.productsDiscountPct}
            />
          </Stack>
        </Grid>

        <Grid size={12}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            {mutation.isError && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {errorMessage(mutation.error)}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              disabled={mutation.isPending}
              sx={{ minWidth: 260 }}
            >
              {mutation.isPending ? 'Confirmando...' : 'Confirmar Asistencia'}
            </Button>

            <Typography variant="caption" color="text.secondary">
              Tus datos se usan únicamente para preparar tu portafolio de promociones.
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}
