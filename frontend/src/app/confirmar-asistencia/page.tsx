import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { RegistrationForm } from '@/components/RegistrationForm';

export default function ConfirmarAsistenciaPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="header" sx={{ bgcolor: '#1a1a2e', color: 'white', py: 2 }}>
        <Container maxWidth="md">
          <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
            Disagro
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Feria de Promociones - {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
        <RegistrationForm />
      </Container>

      <Box component="footer" sx={{ bgcolor: '#1a1a2e', color: 'white', py: 1.5 }}>
        <Container
          maxWidth="md"
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="caption">Atención al cliente: 2223-2425</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            <Link href="/registrations" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Ver confirmaciones registradas
            </Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
