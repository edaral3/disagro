'use client';

import { useState } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useItems } from '@/hooks/useItems';
import { ItemsFilterMenu, type ItemsFilterValue } from './ItemsFilterMenu';
import type { Item } from '@/types/api';

const currency = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

interface ItemsPickerProps {
  selectedItems: Item[];
  onToggle: (item: Item) => void;
}

export function ItemsPicker({ selectedItems, onToggle }: ItemsPickerProps) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ItemsFilterValue>({});
  const { items, isLoading, isFetching } = useItems(search, filters);
  const selectedIds = new Set(selectedItems.map((i) => i.id));

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" component="h2">
        2. Seleccione Servicios y Productos de su interés
      </Typography>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          placeholder="Buscar Servicios y Productos"
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
        <ItemsFilterMenu value={filters} onChange={setFilters} />
      </Stack>

      <Typography variant="subtitle2" color="text.secondary">
        Servicios y/o Productos seleccionados:
      </Typography>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No se encontraron servicios o productos.
          </Typography>
        ) : (
          <List dense disablePadding>
            {items.map((item) => {
              const checked = selectedIds.has(item.id);
              return (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton onClick={() => onToggle(item)} dense>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked={checked}
                        tabIndex={-1}
                        disableRipple
                        color="success"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={
                        <Chip
                          label={item.type === 'SERVICE' ? 'Servicio' : 'Producto'}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
                        />
                      }
                      // secondary por defecto renderiza <p>, y <Chip> renderiza <div> — inválido anidado.
                      slotProps={{ secondary: { component: 'span' } }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {currency.format(item.price)}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Stack>
  );
}
