import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ActiveVehicle,
  Transaction,
  Expense,
  AccountingEntry,
  WashOrder,
  Booking,
  ParkingSpot,
  SpotStatus,
  StoreItem,
  StaffUser,
  VehicleClientRecord,
  ClientReview
} from '../types';

// Get Supabase credentials from environment or localStorage
export function getSupabaseCredentials() {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';


  const localUrl = localStorage.getItem('autopark_supabase_url') || '';
  const localKey = localStorage.getItem('autopark_supabase_anon_key') || '';

  const url = envUrl || localUrl;
  const anonKey = envKey || localKey;

  return { url, anonKey, isFromEnv: Boolean(envUrl && envKey) };
}

let cachedClient: SupabaseClient | null = null;
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  const clientKey = `${url}::${anonKey}`;
  if (cachedClient && lastClientKey === clientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey);
    lastClientKey = clientKey;
    return cachedClient;
  } catch (err) {
    console.error('Error instantiating Supabase client:', err);
    return null;
  }
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem('autopark_supabase_url', url.trim());
  localStorage.setItem('autopark_supabase_anon_key', anonKey.trim());
  cachedClient = null;
  lastClientKey = '';
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('autopark_supabase_url');
  localStorage.removeItem('autopark_supabase_anon_key');
  cachedClient = null;
  lastClientKey = '';
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'No se han ingresado la URL y la Anon Key de Supabase.' };
  }

  try {
    const { data, error } = await supabase.from('transactions').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          success: true,
          message: '¡Conexión a Supabase exitosa! Nota: Ejecute el script SQL en el panel de Supabase para crear las tablas en la nube si aún no lo ha hecho.',
        };
      }
      return { success: false, message: `Error de Supabase: ${error.message}` };
    }

    return { success: true, message: '¡Conexión y consulta a Supabase verificadas correctamente!' };
  } catch (err: any) {
    return { success: false, message: `Error de red o configuración: ${err.message || String(err)}` };
  }
}

// -------------------------------------------------------------
// CLOUD SYNC & CRUD OPERATIONS FOR ALL APP DATA
// -------------------------------------------------------------

// 1. Fetch All App Data From Cloud
export async function fetchAllCloudData() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const [
      vehiclesRes,
      transRes,
      washRes,
      expensesRes,
      accountingRes,
      spotsRes,
      spacesRes,
      bookingsRes,
      storeRes,
      staffRes,
      clientRecRes,
      reviewsRes,
    ] = await Promise.allSettled([
      supabase.from('active_vehicles').select('*'),
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('wash_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('accounting_entries').select('*').order('entry_number', { ascending: false }),
      supabase.from('parking_spots').select('*'),
      supabase.from('parking_spaces').select('*'),
      supabase.from('bookings').select('*').order('date', { ascending: false }),
      supabase.from('store_items').select('*'),
      supabase.from('staff_users').select('*'),
      supabase.from('client_records').select('*'),
      supabase.from('client_reviews').select('*').order('created_at', { ascending: false }),
    ]);

    const activeVehicles: ActiveVehicle[] | null =
      vehiclesRes.status === 'fulfilled' && !vehiclesRes.value.error && vehiclesRes.value.data
        ? vehiclesRes.value.data.map((row: any) => row.data || {
            id: row.id,
            plate: row.plate,
            vehicleType: row.vehicle_type || row.vehicleType,
            spotId: row.spot_id || row.spotId,
            entryTime: row.entry_time || row.entryTime,
            chargingMode: row.charging_mode || row.chargingMode || 'minuto',
            driverName: row.driver_name || row.driverName,
            driverPhone: row.driver_phone || row.driverPhone,
            attachedStoreItems: row.store_items || row.attachedStoreItems || [],
            attachedWashService: row.attached_wash_service || row.attachedWashService,
            notes: row.notes,
          })
        : null;

    const transactions: Transaction[] | null =
      transRes.status === 'fulfilled' && !transRes.value.error && transRes.value.data
        ? transRes.value.data.map((row: any) => row.data || {
            id: row.id,
            ticketNumber: row.ticket_number || row.ticketNumber,
            boletaNumber: row.boleta_number || row.boletaNumber,
            date: row.date,
            type: row.type,
            plate: row.plate,
            vehicleType: row.vehicle_type || row.vehicleType,
            parkingFee: Number(row.parking_fee ?? row.parkingFee ?? 0),
            washFee: Number(row.wash_fee ?? row.washFee ?? 0),
            storeFee: Number(row.store_fee ?? row.storeFee ?? 0),
            netTotal: Number(row.net_total ?? row.netTotal ?? 0),
            vatAmount: Number(row.vat_amount ?? row.vatAmount ?? 0),
            total: Number(row.total ?? 0),
            paymentMethod: row.payment_method || row.paymentMethod || 'efectivo',
            itemDetails: row.item_details || row.itemDetails || [],
          })
        : null;

    const washOrders: WashOrder[] | null =
      washRes.status === 'fulfilled' && !washRes.value.error && washRes.value.data
        ? washRes.value.data.map((row: any) => row.data || {
            id: row.id,
            plate: row.plate,
            vehicleType: row.vehicle_type || row.vehicleType,
            serviceId: row.service_id || row.serviceId,
            serviceName: row.service_name || row.serviceName,
            price: Number(row.price || 0),
            assignedOperator: row.assigned_operator || row.assignedOperator || '',
            status: row.status,
            createdAt: row.created_at || row.createdAt,
            completedAt: row.completed_at || row.completedAt,
            spotId: row.spot_id || row.spotId,
          })
        : null;

    const expenses: Expense[] | null =
      expensesRes.status === 'fulfilled' && !expensesRes.value.error && expensesRes.value.data
        ? expensesRes.value.data.map((row: any) => row.data || {
            id: row.id,
            category: row.category,
            categoryLabel: row.category_label || row.categoryLabel,
            description: row.description,
            amount: Number(row.amount || 0),
            date: row.date,
            paymentMethod: row.payment_method || row.paymentMethod,
          })
        : null;

    const accountingEntries: AccountingEntry[] | null =
      accountingRes.status === 'fulfilled' && !accountingRes.value.error && accountingRes.value.data
        ? accountingRes.value.data.map((row: any) => row.data || {
            id: row.id,
            entryNumber: row.entry_number || row.entryNumber,
            date: row.date,
            concept: row.concept,
            lines: row.lines || [],
            totalDebe: Number(row.total_debe ?? row.totalDebe ?? 0),
            totalHaber: Number(row.total_haber ?? row.totalHaber ?? 0),
            sourceType: row.source_type || row.sourceType,
            referenceId: row.reference_id || row.referenceId,
          })
        : null;

    const rawSpaces = spacesRes.status === 'fulfilled' && !spacesRes.value.error && spacesRes.value.data ? spacesRes.value.data : null;
    const rawSpots = spotsRes.status === 'fulfilled' && !spotsRes.value.error && spotsRes.value.data ? spotsRes.value.data : null;

    let spots: ParkingSpot[] | null = null;

    if (rawSpaces && rawSpaces.length > 0) {
      spots = rawSpaces.map((row: any) => ({
        id: String(row.id),
        label: row.label || `Espacio ${row.id}`,
        zone: row.zone || 'Sector A',
        typeAllowed: row.type_allowed || ['auto', 'camioneta', 'moto', 'furgon', 'suv'],
        status: (row.status || 'disponible') as SpotStatus,
        currentVehicleId: row.vehicle_plate ? `v-${row.vehicle_plate}` : undefined,
        vehiclePlate: row.vehicle_plate || undefined,
        vehicleType: row.vehicle_type || undefined,
        checkInTime: row.check_in_time || undefined,
      }));
    } else if (rawSpots && rawSpots.length > 0) {
      spots = rawSpots.map((row: any) => row.data || row);
    }

    const bookings: Booking[] | null =
      bookingsRes.status === 'fulfilled' && !bookingsRes.value.error && bookingsRes.value.data
        ? bookingsRes.value.data.map((row: any) => row.data || row)
        : null;

    const storeCatalog: StoreItem[] | null =
      storeRes.status === 'fulfilled' && !storeRes.value.error && storeRes.value.data
        ? storeRes.value.data.map((row: any) => row.data || row)
        : null;

    const staffUsers: StaffUser[] | null =
      staffRes.status === 'fulfilled' && !staffRes.value.error && staffRes.value.data
        ? staffRes.value.data.map((row: any) => row.data || row)
        : null;

    const clientRecords: VehicleClientRecord[] | null =
      clientRecRes.status === 'fulfilled' && !clientRecRes.value.error && clientRecRes.value.data
        ? clientRecRes.value.data.map((row: any) => row.data || row)
        : null;

    const clientReviews: ClientReview[] | null =
      reviewsRes.status === 'fulfilled' && !reviewsRes.value.error && reviewsRes.value.data
        ? reviewsRes.value.data.map((row: any) => row.data || row)
        : null;

    return {
      activeVehicles,
      transactions,
      washOrders,
      expenses,
      accountingEntries,
      spots,
      bookings,
      storeCatalog,
      staffUsers,
      clientRecords,
      clientReviews,
    };
  } catch (err) {
    console.warn('Error syncing data from Supabase:', err);
    return null;
  }
}

// 2. Active Vehicles Cloud CRUD
export async function syncActiveVehicleCloud(vehicle: ActiveVehicle) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      id: vehicle.id,
      plate: vehicle.plate,
      vehicle_type: vehicle.vehicleType,
      spot_id: vehicle.spotId,
      entry_time: vehicle.entryTime,
      charging_mode: vehicle.chargingMode,
      driver_name: vehicle.driverName || '',
      driver_phone: vehicle.driverPhone || '',
      store_items: vehicle.attachedStoreItems || [],
      attached_wash_service: vehicle.attachedWashService || null,
      notes: vehicle.notes || '',
      data: vehicle,
    };

    const { error } = await supabase.from('active_vehicles').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase active_vehicles upsert error:', error.message);
  } catch (err) {
    console.warn('Supabase active_vehicles sync error:', err);
  }
}

export async function deleteActiveVehicleCloud(vehicleId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('active_vehicles').delete().eq('id', vehicleId);
    if (error) console.warn('Supabase active_vehicles delete error:', error.message);
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }
}

// 3. Transactions Cloud CRUD
export async function syncTransactionCloud(transaction: Transaction) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      id: transaction.id,
      ticket_number: transaction.ticketNumber,
      boleta_number: transaction.boletaNumber || null,
      date: transaction.date,
      type: transaction.type,
      plate: transaction.plate || '',
      vehicle_type: transaction.vehicleType || '',
      parking_fee: transaction.parkingFee || 0,
      wash_fee: transaction.washFee || 0,
      store_fee: transaction.storeFee || 0,
      net_total: transaction.netTotal || 0,
      vat_amount: transaction.vatAmount || 0,
      total: transaction.total || 0,
      payment_method: transaction.paymentMethod,
      item_details: transaction.itemDetails || [],
      data: transaction,
    };

    const { error } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase transactions upsert error:', error.message);
  } catch (err) {
    console.warn('Supabase transaction sync error:', err);
  }
}

// 4. Wash Orders Cloud CRUD
export async function syncWashOrderCloud(order: WashOrder) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      id: order.id,
      plate: order.plate,
      vehicle_type: order.vehicleType,
      service_id: order.serviceId,
      service_name: order.serviceName,
      assigned_operator: order.assignedOperator,
      status: order.status,
      price: order.price,
      created_at: order.createdAt,
      completed_at: order.completedAt || null,
      spot_id: order.spotId || null,
      data: order,
    };

    const { error } = await supabase.from('wash_orders').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase wash_orders upsert error:', error.message);
  } catch (err) {
    console.warn('Supabase wash_orders sync error:', err);
  }
}

export async function deleteWashOrderCloud(orderId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('wash_orders').delete().eq('id', orderId);
  } catch (err) {
    console.warn('Supabase wash_orders delete error:', err);
  }
}

// 5. Expenses Cloud CRUD
export async function syncExpenseCloud(expense: Expense) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      id: expense.id,
      category: expense.category,
      category_label: expense.categoryLabel,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      payment_method: expense.paymentMethod,
      data: expense,
    };

    const { error } = await supabase.from('expenses').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase expenses upsert error:', error.message);
  } catch (err) {
    console.warn('Supabase expenses sync error:', err);
  }
}

// 6. Accounting Entries Cloud CRUD
export async function syncAccountingEntryCloud(entry: AccountingEntry) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      id: entry.id,
      entry_number: entry.entryNumber,
      date: entry.date,
      concept: entry.concept,
      lines: entry.lines,
      total_debe: entry.totalDebe,
      total_haber: entry.totalHaber,
      source_type: entry.sourceType,
      reference_id: entry.referenceId || null,
      data: entry,
    };

    const { error } = await supabase.from('accounting_entries').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase accounting_entries upsert error:', error.message);
  } catch (err) {
    console.warn('Supabase accounting sync error:', err);
  }
}

// 7. Bookings Cloud CRUD
export async function syncBookingCloud(booking: Booking) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      id: booking.id,
      client_name: booking.clientName,
      client_phone: booking.clientPhone,
      plate: booking.plate,
      date: booking.date,
      time_slot: booking.timeSlot,
      service_type: booking.serviceType,
      status: booking.status,
      notes: booking.notes || '',
      data: booking,
    };

    const { error } = await supabase.from('bookings').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase bookings upsert error:', error.message);
  } catch (err) {
    console.warn('Supabase bookings sync error:', err);
  }
}

// 8. Bulk Sync helpers for spots, catalog, staff users, client records, reviews
export async function syncSpotsCloud(spots: ParkingSpot[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const rows = spots.map((s) => ({
      id: s.id,
      zone: s.zone,
      status: s.status,
      current_vehicle_id: s.currentVehicleId || null,
      data: s,
    }));
    await supabase.from('parking_spots').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase parking_spots sync error:', err);
  }
}

export async function syncStoreCatalogCloud(catalog: StoreItem[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const rows = catalog.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      stock: item.stock,
      code: item.code,
      data: item,
    }));
    await supabase.from('store_items').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase store_items sync error:', err);
  }
}

export async function syncStaffUsersCloud(users: StaffUser[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const rows = users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      pin: u.pin,
      data: u,
    }));
    await supabase.from('staff_users').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase staff_users sync error:', err);
  }
}

export async function syncClientRecordsCloud(records: VehicleClientRecord[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const rows = records.map((r) => ({
      id: r.id,
      plate: r.plate,
      client_name: r.clientName,
      data: r,
    }));
    await supabase.from('client_records').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase client_records sync error:', err);
  }
}

export async function syncClientReviewsCloud(reviews: ClientReview[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const rows = reviews.map((r) => ({
      id: r.id,
      plate: r.plate,
      client_name: r.clientName,
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt,
      data: r,
    }));
    await supabase.from('client_reviews').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase client_reviews sync error:', err);
  }
}

// -------------------------------------------------------------
// PARKING_SPACES DIRECT CRUD & REALTIME SUBSCRIPTION
// -------------------------------------------------------------

export async function fetchParkingSpacesCloud(): Promise<ParkingSpot[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('parking_spaces').select('*');
    if (error) {
      console.warn('fetchParkingSpacesCloud query error:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: String(row.id),
      label: row.label || `Espacio ${row.id}`,
      zone: row.zone || 'Sector A',
      typeAllowed: row.type_allowed || ['auto', 'camioneta', 'moto', 'furgon', 'suv'],
      status: (row.status || 'disponible') as SpotStatus,
      currentVehicleId: row.vehicle_plate ? `v-${row.vehicle_plate}` : undefined,
      vehiclePlate: row.vehicle_plate || undefined,
      vehicleType: row.vehicle_type || undefined,
      checkInTime: row.check_in_time || undefined,
    }));
  } catch (err) {
    console.warn('fetchParkingSpacesCloud error:', err);
    return null;
  }
}

export async function parkVehicleSpaceCloud(
  spaceId: string,
  plate: string,
  vehicleType: string,
  checkInTime: string
) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      status: 'ocupado',
      vehicle_plate: plate,
      vehicle_type: vehicleType,
      check_in_time: checkInTime,
    };

    // Try update by id or label
    const { error } = await supabase
      .from('parking_spaces')
      .update(payload)
      .eq('id', spaceId);

    if (error) {
      console.warn('parkVehicleSpaceCloud update by id error, trying by label:', error.message);
      await supabase
        .from('parking_spaces')
        .update(payload)
        .eq('label', spaceId);
    }
  } catch (err) {
    console.warn('parkVehicleSpaceCloud error:', err);
  }
}

export async function releaseVehicleSpaceCloud(spaceId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const payload = {
      status: 'disponible',
      vehicle_plate: null,
      vehicle_type: null,
      check_in_time: null,
    };

    const { error } = await supabase
      .from('parking_spaces')
      .update(payload)
      .eq('id', spaceId);

    if (error) {
      console.warn('releaseVehicleSpaceCloud update by id error, trying by label:', error.message);
      await supabase
        .from('parking_spaces')
        .update(payload)
        .eq('label', spaceId);
    }
  } catch (err) {
    console.warn('releaseVehicleSpaceCloud error:', err);
  }
}

export function subscribeParkingSpacesRealtime(
  onRealtimeChange: (row: any) => void
) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:parking_spaces')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_spaces' },
        (payload) => {
          if (payload.new) {
            onRealtimeChange(payload.new);
          } else if (payload.old) {
            onRealtimeChange(payload.old);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('subscribeParkingSpacesRealtime error:', err);
    return () => {};
  }
}

export function subscribeAllRealtimeCloud(onAnyChange: () => void) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:all_tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_spaces' }, () => onAnyChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_vehicles' }, () => onAnyChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => onAnyChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wash_orders' }, () => onAnyChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => onAnyChange())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('subscribeAllRealtimeCloud error:', err);
    return () => {};
  }
}


// SQL DDL Schema generator for easy copy-paste into Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ESQUEMA COMPLETO DE TABLAS PARA AUTOPARK Y CARWASH EN SUPABASE
-- Copia y ejecuta este script completo en el "SQL Editor" de tu panel de Supabase:

-- 1. Tabla de Vehículos Activos en Patio
CREATE TABLE IF NOT EXISTS active_vehicles (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL,
  vehicle_type TEXT,
  spot_id TEXT,
  entry_time TIMESTAMPTZ NOT NULL,
  charging_mode TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  store_items JSONB DEFAULT '[]'::jsonb,
  attached_wash_service JSONB,
  notes TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Transacciones y Cobros (Histórico de Ventas)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  ticket_number TEXT,
  boleta_number INTEGER,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  plate TEXT,
  vehicle_type TEXT,
  parking_fee NUMERIC DEFAULT 0,
  wash_fee NUMERIC DEFAULT 0,
  store_fee NUMERIC DEFAULT 0,
  net_total NUMERIC DEFAULT 0,
  vat_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL,
  item_details JSONB DEFAULT '[]'::jsonb,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Órdenes de Lavado (CarWash)
CREATE TABLE IF NOT EXISTS wash_orders (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL,
  vehicle_type TEXT,
  service_id TEXT,
  service_name TEXT,
  assigned_operator TEXT,
  status TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  spot_id TEXT,
  data JSONB
);

-- 4. Tabla de Gastos Operacionales
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  category_label TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  payment_method TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Asientos Contables (Libro Diario)
CREATE TABLE IF NOT EXISTS accounting_entries (
  id TEXT PRIMARY KEY,
  entry_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  concept TEXT NOT NULL,
  lines JSONB NOT NULL,
  total_debe NUMERIC DEFAULT 0,
  total_haber NUMERIC DEFAULT 0,
  source_type TEXT NOT NULL,
  reference_id TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Puestos de Estacionamiento
CREATE TABLE IF NOT EXISTS parking_spots (
  id TEXT PRIMARY KEY,
  zone TEXT,
  status TEXT,
  current_vehicle_id TEXT,
  data JSONB
);

-- 7. Tabla de Reservas de Clientes
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  plate TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Catálogo de Tienda
CREATE TABLE IF NOT EXISTS store_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  code TEXT,
  data JSONB
);

-- 9. Usuarios / Personal de Sistema
CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  pin TEXT NOT NULL,
  data JSONB
);

-- 10. Clientes y Reseñas
CREATE TABLE IF NOT EXISTS client_records (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL,
  client_name TEXT,
  data JSONB
);

CREATE TABLE IF NOT EXISTS client_reviews (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL,
  client_name TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Habilitar RLS y políticas públicas para la API
ALTER TABLE active_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura y escritura publica active_vehicles" ON active_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica wash_orders" ON wash_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica accounting_entries" ON accounting_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica parking_spots" ON parking_spots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica store_items" ON store_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica staff_users" ON staff_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica client_records" ON client_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura y escritura publica client_reviews" ON client_reviews FOR ALL USING (true) WITH CHECK (true);
`;

