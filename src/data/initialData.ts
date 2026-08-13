import {
  Booking,
  CarWashService,
  ParkingSpot,
  RateConfig,
  StoreItem,
  WashOrder,
  ActiveVehicle,
  Transaction,
  VehicleClientRecord,
  ClientReview,
  Expense,
  StaffUser,
  AppConfig,
  PayrollSlip,
} from '../types';

export const defaultAppConfig: AppConfig = {
  appTitle: 'AutoPark & CarWash Control',
  logoUrl: '',
  cardFeePercentage: 2.5,
  appPin: '12345678', // Clave de acceso min 8 dígitos
  isLocked: false,
  printer58mm: {
    widthMm: 58,
    headerText: 'Bamo garage spa',
    companyRut: '78.084.649-6',
    companyAddress: 'Cobija 2058',
    companySii: 'SII CALAMA',
    footerText: '¡Gracias por su preferencia! Conserve este comprobante.',
    showQr: true,
    fontSizePx: 12,
  },
};

export const defaultRateConfig: RateConfig = {
  mode: 'tramo', // Default to interval charging
  minuteRate: 30, // $30 por minuto en cobro directo
  firstBlockMinutes: 30, // 30 minutos mínimo obligado por especificación
  firstBlockPrice: 900, // $900 por los primeros 30 minutos (tramo fijo inicial)
  subsequentBlockMinutes: 10, // 10 minutos cada tramo siguiente
  subsequentBlockPrice: 300, // $300 por cada tramo extra de 10 min
  gracePeriodMinutes: 5, // 5 minutos de tolerancia
  nightlyRate: 8000, // $8.000 por noche de pernocte
  typeMultipliers: {
    auto: 1.0,
    camioneta: 1.25,
    suv: 1.2,
    moto: 0.7,
    furgon: 1.4,
  },
};

export const initialStaffUsers: StaffUser[] = [
  {
    id: 'usr-1',
    username: 'admin',
    name: 'Administrador General',
    rut: '15.220.104-5',
    role: 'admin',
    pin: '12345678',
    baseSalary: 950000,
    afpName: 'habitat',
    healthType: 'fonasa',
  },
  {
    id: 'usr-2',
    username: 'parquero',
    name: 'Pedro Morales (Parquero/Lavador)',
    rut: '18.490.312-K',
    role: 'lavador_parquero',
    pin: '22224444',
    baseSalary: 520000,
    afpName: 'modelo',
    healthType: 'fonasa',
  },
  {
    id: 'usr-3',
    username: 'vendedora',
    name: 'Ana Gómez (Vendedora Tienda)',
    rut: '17.882.109-8',
    role: 'vendedora_tienda',
    pin: '11113333',
    baseSalary: 500000,
    afpName: 'provida',
    healthType: 'fonasa',
  },
  {
    id: 'usr-4',
    username: 'cliente',
    name: 'Portal Cliente Autogestión',
    role: 'cliente',
    pin: '00000000',
  },
];

export const initialPayrollSlips: PayrollSlip[] = [];

export const initialSpots: ParkingSpot[] = [
  // Sector A
  { id: 'A1', zone: 'Sector A', typeAllowed: ['auto', 'suv', 'camioneta'], status: 'disponible' },
  { id: 'A2', zone: 'Sector A', typeAllowed: ['auto', 'suv'], status: 'disponible' },
  { id: 'A3', zone: 'Sector A', typeAllowed: ['auto', 'suv'], status: 'disponible' },
  { id: 'A4', zone: 'Sector A', typeAllowed: ['auto', 'suv', 'camioneta'], status: 'disponible' },
  { id: 'A5', zone: 'Sector A', typeAllowed: ['auto', 'camioneta', 'furgon'], status: 'disponible' },
  
  // Sector B
  { id: 'B1', zone: 'Sector B', typeAllowed: ['auto', 'suv'], status: 'disponible' },
  { id: 'B2', zone: 'Sector B', typeAllowed: ['auto', 'suv'], status: 'disponible' },
  { id: 'B3', zone: 'Sector B', typeAllowed: ['auto', 'camioneta'], status: 'disponible' },
  { id: 'B4', zone: 'Sector B', typeAllowed: ['camioneta', 'furgon'], status: 'disponible', isNightlySpot: true },

  // Sector Motos
  { id: 'M1', zone: 'Motos', typeAllowed: ['moto'], status: 'disponible' },
  { id: 'M2', zone: 'Motos', typeAllowed: ['moto'], status: 'disponible' },
  
  // Sector VIP
  { id: 'VIP1', zone: 'Sector VIP', typeAllowed: ['auto', 'suv', 'camioneta'], status: 'disponible' },
  { id: 'VIP2', zone: 'Sector VIP', typeAllowed: ['auto', 'suv', 'camioneta'], status: 'disponible' },
];

export const initialActiveVehicles: ActiveVehicle[] = [];

export const initialStoreItems: StoreItem[] = [
  { id: 'p1', name: 'Agua Mineral Sin Gas 500ml', category: 'bebidas', price: 1200, stock: 50, minStock: 10, code: 'BEB-01', barcode: '7801234567890', brand: 'Cachantun', model: 'Botella PET', weightValue: 500, weightUnit: 'ml' },
  { id: 'p2', name: 'Bebida Energizante Red Bull', category: 'bebidas', price: 2500, stock: 30, minStock: 5, code: 'BEB-02', barcode: '9002490204780', brand: 'Red Bull', model: 'Lata Energy', weightValue: 250, weightUnit: 'ml' },
  { id: 'p3', name: 'Snack Papas Lay\'s 150g', category: 'snacks', price: 1800, stock: 20, minStock: 5, code: 'SNA-01', barcode: '7802200112233', brand: 'Lay\'s', model: 'Corte Liso', weightValue: 150, weightUnit: 'g' },
  { id: 'p4', name: 'Aromatizante Pinito Auto', category: 'limpieza', price: 1500, stock: 30, minStock: 8, code: 'LIM-01', barcode: '7809988776655', brand: 'Little Trees', model: 'Vanilla Pride', weightValue: 50, weightUnit: 'g' },
  { id: 'p5', name: 'Microfibra Limpieza 40x40', category: 'limpieza', price: 2900, stock: 15, minStock: 4, code: 'LIM-02', barcode: '7804455667788', brand: 'Meguiar\'s', model: 'Supreme Shine', weightValue: 200, weightUnit: 'g' },
  { id: 'p6', name: 'Aceite Motor 10W-40 1L (Mobil)', category: 'aceites', price: 14500, stock: 10, minStock: 2, code: 'ACE-01', barcode: '071924147721', brand: 'Mobil 1', model: 'Super 2000 Semi-sintético', weightValue: 1, weightUnit: 'l' },
  { id: 'p7', name: 'Líquido Limpiaparabrisas 1L', category: 'limpieza', price: 3500, stock: 15, minStock: 4, code: 'LIM-03', barcode: '7807766554433', brand: 'Sonax', model: 'Concentrado Visión Clara', weightValue: 1, weightUnit: 'l' },
  { id: 'p8', name: 'Cargador USB para Cenicero 12V', category: 'accesorios', price: 6900, stock: 10, minStock: 3, code: 'ACC-01', barcode: '6955443322110', brand: 'Anker', model: 'PowerDrive 2 Dual', weightValue: 120, weightUnit: 'g' },
  { id: 'p9', name: 'Soporte Celular Magnético', category: 'accesorios', price: 8900, stock: 10, minStock: 3, code: 'ACC-02', barcode: '6955443322127', brand: 'Baseus', model: 'Magnetic Air Vent', weightValue: 150, weightUnit: 'g' },
];

export const initialExpenses: Expense[] = [];

export const initialWashServices: CarWashService[] = [
  {
    id: 'w1',
    name: 'Lavado Express Exterior',
    description: 'Hidrolavado, champú con cera, secado con microfibra y silicona en neumáticos.',
    durationMinutes: 25,
    price: 8000,
    category: 'exterior',
  },
  {
    id: 'w2',
    name: 'Lavado Completo (Interior + Exterior)',
    description: 'Lavado exterior + aspirado profundo de alfombras, asientos, limpieza de tableros y vidrios.',
    durationMinutes: 45,
    price: 13500,
    category: 'completo',
  },
  {
    id: 'w3',
    name: 'Lavado Premium + Encerado Manual',
    description: 'Lavado completo + aplicación de cera sintética de alto brillo y tratamiento para plásticos.',
    durationMinutes: 70,
    price: 24900,
    category: 'premium',
  },
  {
    id: 'w4',
    name: 'Limpieza e Higienización de Tapiz',
    description: 'Lavado por inyección y extracción para asientos de tela o cuero con eliminación de olores.',
    durationMinutes: 90,
    price: 35000,
    category: 'especial',
  },
  {
    id: 'w5',
    name: 'Lavado y Desengrasado de Motor',
    description: 'Limpieza detallada con desengrasante biodegradable y protector de goma/mangueras.',
    durationMinutes: 40,
    price: 18000,
    category: 'especial',
  },
];

export const initialWashOrders: WashOrder[] = [];

export const initialBookings: Booking[] = [];

export const initialTransactions: Transaction[] = [];

export const initialClientRecords: VehicleClientRecord[] = [];

export const initialClientReviews: ClientReview[] = [];
