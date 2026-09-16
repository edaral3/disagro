'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FilterListIcon from '@mui/icons-material/FilterList';
import type { ItemType } from '@/types/api';
import type { ItemsSortOption } from '@/api/items';

export interface ItemsFilterValue {
  type?: ItemType;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ItemsSortOption;
}

interface ItemsFilterMenuProps {
  value: ItemsFilterValue;
  onChange: (value: ItemsFilterValue) => void;
}

const TYPE_OPTIONS: { value: ItemType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'SERVICE', label: 'Servicios' },
  { value: 'PRODUCT', label: 'Productos' },
];

/**
 * Botón + panel de filtros avanzados para el buscador de ítems: tipo
 * (servicios/productos/ambos), rango de precio, y orden por precio.
 * Los cambios se aplican de inmediato (mismo criterio que la búsqueda de
 * texto, que ya filtra en vivo) — no hay botón "Aplicar".
 */
export function ItemsFilterMenu({ value, onChange }: ItemsFilterMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const hasActiveFilters =
    !!value.type ||
    value.minPrice !== undefined ||
    value.maxPrice !== undefined ||
    !!value.sortBy;

  function handleTypeChange(_event: React.MouseEvent<HTMLElement>, newType: ItemType | 'ALL' | null) {
    if (newType === null) return; // ToggleButtonGroup exclusive: ignora el deselect
    onChange({ ...value, type: newType === 'ALL' ? undefined : newType });
  }

  function handlePriceChange(field: 'minPrice' | 'maxPrice', raw: string) {
    if (raw === '') {
      onChange({ ...value, [field]: undefined });
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    onChange({ ...value, [field]: parsed });
  }

  function handleSortChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    onChange({ ...value, sortBy: raw === 'default' ? undefined : (raw as ItemsSortOption) });
  }

  function handleClear() {
    onChange({});
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Filtros de búsqueda"
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
      >
        <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
          <FilterListIcon fontSize="small" />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack spacing={2} sx={{ p: 2, width: 260 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Tipo</Typography>
            <ToggleButtonGroup
              value={value.type ?? 'ALL'}
              exclusive
              onChange={handleTypeChange}
              size="small"
              fullWidth
            >
              {TYPE_OPTIONS.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Rango de precio (Q.)</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Mínimo"
                type="number"
                size="small"
                value={value.minPrice ?? ''}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
              />
              <TextField
                label="Máximo"
                type="number"
                size="small"
                value={value.maxPrice ?? ''}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
              />
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Ordenar por precio</Typography>
            <RadioGroup value={value.sortBy ?? 'default'} onChange={handleSortChange}>
              <FormControlLabel value="default" control={<Radio size="small" />} label="Por defecto" />
              <FormControlLabel
                value="price_asc"
                control={<Radio size="small" />}
                label="Menor a mayor"
              />
              <FormControlLabel
                value="price_desc"
                control={<Radio size="small" />}
                label="Mayor a menor"
              />
            </RadioGroup>
          </Stack>

          <Button size="small" onClick={handleClear} disabled={!hasActiveFilters}>
            Limpiar filtros
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
