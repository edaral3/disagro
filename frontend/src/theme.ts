'use client';

import { createTheme } from '@mui/material/styles';

/**
 * Paleta acorde al mockup: header/footer oscuros, acento azul en el botón
 * principal y en los checks de selección.
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51e8',
    },
    success: {
      main: '#2e7d32',
    },
    background: {
      default: '#f5f6fa',
    },
    text: {
      primary: '#1a1a2e',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});
