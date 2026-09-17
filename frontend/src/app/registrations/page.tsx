import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { RegistrationsView } from '@/components/RegistrationsView';

export default function RegistrationsPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="header" sx={{ bgcolor: '#1a1a2e', color: 'white', py: 2 }}>
        <Container maxWidth="lg">
          <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
            Disagro
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Confirmaciones registradas
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <RegistrationsView />
      </Container>
    </Box>
  );
}
