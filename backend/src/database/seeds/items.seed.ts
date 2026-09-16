import { ItemType } from '../../items/entities/item.entity';

export const itemsSeed = [
  // Servicios
  {
    name: 'Consultoría de Negocios',
    description: 'Asesoría personalizada en estrategia y operaciones',
    price: 150.00,
    type: ItemType.SERVICE,
    category: 'Estrategia',
  },
  {
    name: 'Servicio de Telefonía',
    description: 'Línea telefónica con cobertura nacional',
    price: 50.30,
    type: ItemType.SERVICE,
    category: 'Comunicaciones',
  },
  {
    name: 'Servicio de Internet',
    description: 'Conexión a internet de alta velocidad',
    price: 100.00,
    type: ItemType.SERVICE,
    category: 'Comunicaciones',
  },
  {
    name: 'Soporte Técnico 24/7',
    description: 'Atención técnica disponible 24 horas, 7 días a la semana',
    price: 200.50,
    type: ItemType.SERVICE,
    category: 'Soporte',
  },
  {
    name: 'Capacitación en Seguridad',
    description: 'Programa de capacitación en seguridad informática',
    price: 300.00,
    type: ItemType.SERVICE,
    category: 'Capacitación',
  },

  // Productos
  {
    name: 'Antivirus Premium',
    description: 'Software de protección contra malware y virus',
    price: 49.99,
    type: ItemType.PRODUCT,
    category: 'Software',
  },
  {
    name: 'Router WiFi 6',
    description: 'Dispositivo router de última generación',
    price: 80.50,
    type: ItemType.PRODUCT,
    category: 'Hardware',
  },
  {
    name: 'Backup en la Nube',
    description: '1TB de almacenamiento en la nube con sincronización automática',
    price: 350.00,
    type: ItemType.PRODUCT,
    category: 'Almacenamiento',
  },
  {
    name: 'Webcam HD',
    description: 'Cámara web 1080p para videoconferencias',
    price: 60.00,
    type: ItemType.PRODUCT,
    category: 'Hardware',
  },
  {
    name: 'Licencia Office 365',
    description: 'Suite completa de Microsoft Office con sincronización en la nube',
    price: 120.00,
    type: ItemType.PRODUCT,
    category: 'Software',
  },
  {
    name: 'Monitor 27"',
    description: 'Monitor LED 27 pulgadas, resolución 2K',
    price: 200.00,
    type: ItemType.PRODUCT,
    category: 'Hardware',
  },
];
