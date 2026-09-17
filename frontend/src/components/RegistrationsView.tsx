'use client';

import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useRegistrations } from '@/hooks/useRegistrations';
import type { RegistrationsSortOption } from '@/api/registrations';
import type { RegistrationResponse } from '@/types/api';

const dateFormatter = new Intl.DateTimeFormat('es-GT', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function countByType(registration: RegistrationResponse, type: 'SERVICE' | 'PRODUCT'): number {
  return registration.items.filter((item) => item.itemType === type).length;
}

function DiscountChip({ pct }: { pct: number }) {
  return (
    <Chip
      label={`${pct}%`}
      size="small"
      color={pct > 0 ? 'success' : 'default'}
      variant={pct > 0 ? 'filled' : 'outlined'}
    />
  );
}

export function RegistrationsView() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<RegistrationsSortOption>('createdAt_desc');
  const { registrations, isLoading, isFetching, error } = useRegistrations(search, sortBy);

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          placeholder="Buscar por nombre o email"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: isFetching ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="registrations-sort-label">Orden</InputLabel>
          <Select
            labelId="registrations-sort-label"
            label="Orden"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RegistrationsSortOption)}
          >
            <MenuItem value="createdAt_desc">Más recientes primero</MenuItem>
            <MenuItem value="createdAt_asc">Más antiguas primero</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error">No se pudo cargar la lista de confirmaciones.</Alert>}

      <Paper variant="outlined">
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : registrations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            No se encontraron confirmaciones.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Fecha del evento</TableCell>
                  <TableCell align="center">Servicios</TableCell>
                  <TableCell align="center">Productos</TableCell>
                  <TableCell align="center">Desc. Servicios</TableCell>
                  <TableCell align="center">Desc. Productos</TableCell>
                  <TableCell>Confirmado el</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id} hover>
                    <TableCell>
                      {registration.firstName} {registration.lastName}
                    </TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>{formatDate(registration.eventDateTime)}</TableCell>
                    <TableCell align="center">{countByType(registration, 'SERVICE')}</TableCell>
                    <TableCell align="center">{countByType(registration, 'PRODUCT')}</TableCell>
                    <TableCell align="center">
                      <DiscountChip pct={registration.servicesDiscountPct} />
                    </TableCell>
                    <TableCell align="center">
                      <DiscountChip pct={registration.productsDiscountPct} />
                    </TableCell>
                    <TableCell>{formatDate(registration.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
}
