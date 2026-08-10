export type ChargingMode = 'minuto' | 'tramo' | 'nocturno';

export type VehicleType = 'auto' | 'camioneta' | 'moto' | 'furgon' | 'suv';

export interface RateConfig {
  mode: ChargingMode; // default mode
  minuteRate: number; // cost per minute (e.g. $30)
  firstBlockMinutes: number; // min 30 minutes as requested
  firstBlockPrice: number; // cost for the first block (e.g. $1200)
  subsequentBlockMinutes: number; // fixed 10 minutes as requested
  subsequentBlockPrice: number; // cost for each additional 10 min block (e.g. $400)
  gracePeriodMinutes: number; // e.g. 5 minutes grace
  nightlyRate: number; // tarifa fija por noche de arriendo nocturno (e.g. $8000)
  typeMultipliers: Record<VehicleType, number>;
}

export type SpotStatus = 'disponible' | 'ocupado' | 'reservado' | 'mantenimiento';

export interface ParkingSpot {
  id: string; // e.g. "A1", "A2", "B1"
  zone: string; // e.g. "Sector A", "Sector B", "VIP", "Motos"
  typeAllowed: VehicleType[];
  status: SpotStatus;
  currentVehicleId?: string;
  isNightlySpot?: boolean;
}

export interface ActiveVehicle {
  id: string;
  plate: string; // License plate
  vehicleType: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  spotId: string;
  entryTime: string; // ISO string
  chargingMode: ChargingMode;
  isNightlyRental?: boolean;
  nightlyNightsCount?: number;
  driverName?: string;
  driverPhone?: string;
  attachedStoreItems: { item: StoreItem; quantity: number; total: number }[];
  attachedWashService?: {
    serviceId: string;
    serviceName: string;
    price: number;
    status: WashStatus;
  };
  notes?: string;
}

export type StoreCategory = 'bebidas' | 'snacks' | 'limpieza' | 'accesorios' | 'aceites';

export type WeightUnit = 'g' | 'kg' | 'ml' | 'l' | 'unidades';

export interface Printer58mmConfig {
  widthMm: number; // default 58
  headerText: string; // e.g. "Bamo garage spa"
  companyRut?: string; // e.g. "78.084.649-6"
  companyAddress?: string; // e.g. "Cobija 2058"
  companySii?: string; // e.g. "SII CALAMA"
  footerText: string; // e.g. "¡Gracias por su visita! Guarde este comprobante."
  showQr: boolean;
  fontSizePx: number; // tamaño de fuente del ticket
  showLogo?: boolean; // toggle logo en ticket
  logoUrl?: string; // logo personalizado para el ticket
  featuredText?: string; // texto destacado del ticket (promocional, advertencia o mensaje)
}

export interface AppConfig {
  appTitle: string;
  logoUrl: string;
  cardFeePercentage: number; // e.g. 2.5
  appPin: string; // passcode min 8 digits, default "12345678"
  printer58mm: Printer58mmConfig;
  isLocked: boolean;
}

export interface StoreItem {
  id: string;
  name: string;
  category: StoreCategory;
  price: number;
  stock: number;
  minStock: number;
  code: string; // SKU / Barcode
  barcode?: string; // Código de barras para lector Bluetooth/USB
  brand?: string; // Marca (ej. Mobil, Red Bull, Meguiar's)
  model?: string; // Modelo específico
  weightValue?: number; // Cantidad en peso o volumen (ej: 500)
  weightUnit?: WeightUnit; // Unidad (ej: ml, kg, g, l)
  image?: string;
  isOnSale?: boolean;
  discountPercent?: number; // e.g. 15 for 15%
  salePrice?: number; // Precio promocional calculado o directo
}

export interface CartItem {
  item: StoreItem;
  quantity: number;
}

export interface CarWashService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: 'exterior' | 'completo' | 'premium' | 'especial';
}

export type WashStatus = 'pendiente' | 'en_proceso' | 'listo' | 'entregado';

export interface WashOrder {
  id: string;
  plate: string;
  vehicleType: VehicleType;
  serviceId: string;
  serviceName: string;
  price: number;
  assignedOperator: string;
  status: WashStatus;
  createdAt: string;
  completedAt?: string;
  spotId?: string;
}

export type BookingStatus = 'confirmada' | 'pendiente' | 'completada' | 'cancelada';

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  plate: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM e.g. "10:00"
  serviceType: 'estacionamiento' | 'lavado' | 'ambos';
  washServiceId?: string;
  spotId?: string;
  status: BookingStatus;
  notes?: string;
}

export interface Transaction {
  id: string;
  ticketNumber: string;
  boletaNumber?: number;
  date: string; // ISO string
  type: 'estacionamiento' | 'tienda' | 'lavado' | 'mixto' | 'arriendo_nocturno' | 'cobro_extra';
  plate?: string;
  vehicleType?: VehicleType;
  durationMinutes?: number;
  chargingMode?: ChargingMode;
  parkingFee: number;
  storeFee: number;
  washFee: number;
  surchargeFee?: number; // Cobro por vehículo mal estacionado u otros conceptos
  surchargeReason?: string;
  discount: number;
  tax: number;
  total: number;
  amountPaid?: number; // Monto pagado / entregado por el cliente
  changeGiven?: number; // Vuelto o cambio entregado
  vatAmount?: number; // IVA del monto (19% incluido)
  cardFee?: number;
  netTotal?: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  paymentReference?: string; // Código de confirmación, voucher o N° de transferencia para conciliación
  itemDetails: string[];
}

export type AfpChile = 'capital' | 'cuprum' | 'habitat' | 'planvital' | 'provida' | 'modelo' | 'uno';

export interface PayrollSlip {
  id: string;
  period: string; // e.g. "2026-08"
  dateIssued: string; // ISO string
  
  // Datos del Trabajador
  employeeId: string;
  employeeName: string;
  employeeRut: string;
  employeeRole: string;
  contractType: 'indefinido' | 'plazo_fijo';
  
  // Parámetros de Trabajo
  workedDays: number; // 1-30 días
  baseSalary: number; // Sueldo Base CLP
  overtimeHours: number; // Cantidad Horas Extra
  overtimePay: number; // Valor $ Horas Extra (50% recargo)
  bonusesPay: number; // Bonos/Comisiones Imponibles
  legalGratification: number; // Gratificación Legal 25% (tope 4.75 IMM / 12)
  
  // Total Haberes Imponibles
  totalTaxable: number;
  
  // Haberes No Imponibles
  lunchAllowance: number; // Colación
  transportAllowance: number; // Movilización
  familyAllowance: number; // Cargas Familiares
  totalNonTaxable: number;
  
  // Total Haberes
  totalGrossIncome: number;
  
  // Descuentos Legales Previsionales
  afpName: AfpChile;
  afpRate: number; // e.g. 11.27
  afpDeduction: number;
  
  healthType: 'fonasa' | 'isapre';
  healthRate: number; // 7%
  healthDeduction: number;
  
  unemploymentInsuranceDeduction: number; // 0.6%
  totalSocialDeductions: number;
  
  // Impuesto Único de Segunda Categoría
  secondCategoryTax: number;
  
  otherDeductions: number; // Anticipos
  totalDeductions: number;
  
  // Alcance Líquido / Sueldo Líquido
  netPay: number;
  
  paymentMethod: 'transferencia' | 'efectivo' | 'cheque';
  status: 'pagado' | 'pendiente';
  notes?: string;
}

export type ExpenseCategory =
  | 'agua'
  | 'luz'
  | 'internet'
  | 'arriendo'
  | 'contador'
  | 'mercancia'
  | 'mantenimiento'
  | 'sueldos'
  | 'otro';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  categoryLabel: string;
  description: string;
  amount: number;
  date: string; // ISO string
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  receiptNumber?: string;
  registeredBy?: string;
}

export interface PlateEngravingConfig {
  plateText: string;
  fontFamily: 'FE-Schrift' | 'Arial' | 'Monospace';
  isMirror: boolean;
  copies: number; // 1 to 12
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
  density: number; // 100 to 300% (grosor/oscuridad)
  showLogo: boolean;
  logoBrand: string;
  customLogoUrl?: string;
  logoSize: number;
  spacingLogoPlate: number;
}

export type UserRole = 'admin' | 'lavador_parquero' | 'vendedora_tienda' | 'cliente';

export interface StaffUser {
  id: string;
  username: string;
  name: string;
  rut?: string;
  role: UserRole;
  pin: string; // Clave de acceso obligatoria de 4 u 8 dígitos
  baseSalary?: number; // Sueldo base predeterminado
  afpName?: AfpChile;
  healthType?: 'fonasa' | 'isapre';
}

export type ClientCategory = 'normal' | 'vip' | 'mala_resena';

export interface VehicleClientRecord {
  id: string;
  plate: string;
  make: string;
  model: string;
  color: string;
  year: number;
  vehicleType: VehicleType;
  
  // Datos personales (Manejo interno personal)
  clientName: string;
  clientRut: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;

  category: ClientCategory;
  internalNotes?: string;
  reviewNote?: string; // Observaciones de reseña
  rating?: number; // 1-5 estrellas
  createdAt: string;
  updatedAt: string;
}

export interface ClientReview {
  id: string;
  clientName: string;
  clientEmail?: string;
  plate: string;
  rating: number; // 1-5
  comment: string;
  serviceType: string;
  createdAt: string;
}


export interface ClientUser {

  id: string;
  email: string;
  name: string;
  phone?: string;
  isVerified: boolean;
  registeredPlates: string[];
  authProvider: 'email' | 'google';
}

export type AccountingAccountType =
  | 'activo'
  | 'pasivo'
  | 'patrimonio'
  | 'ingreso'
  | 'gasto';

export interface AccountingAccount {
  code: string;
  name: string;
  type: AccountingAccountType;
  description?: string;
}

export interface AccountingEntryLine {
  accountCode: string;
  accountName: string;
  accountType: AccountingAccountType;
  debe: number;
  haber: number;
  memo?: string;
}

export interface AccountingEntry {
  id: string;
  entryNumber: number;
  date: string;
  concept: string;
  lines: AccountingEntryLine[];
  totalDebe: number;
  totalHaber: number;
  sourceType: 'auto_venta' | 'auto_gasto' | 'auto_nomina' | 'manual';
  referenceId?: string;
  createdAt: string;
}



