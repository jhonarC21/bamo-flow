import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment or localStorage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
    // Try querying a dummy or standard system query
    const { data, error } = await supabase.from('transactions').select('count', { count: 'exact', head: true });
    
    if (error) {
      // If table doesn't exist yet, but connection succeeded
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          success: true,
          message: '¡Conexión a Supabase exitosa! (La tabla "transactions" aún no ha sido creada en la base de datos).',
        };
      }
      return { success: false, message: `Error de Supabase: ${error.message}` };
    }

    return { success: true, message: '¡Conexión y consulta a Supabase verificadas correctamente!' };
  } catch (err: any) {
    return { success: false, message: `Error de red o configuración: ${err.message || String(err)}` };
  }
}

// SQL DDL Schema generator for easy copy-paste into Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ESQUEMA DE TABLAS PARA AUTOPARK EN SUPABASE
-- Copia y ejecuta este script en el "SQL Editor" de tu panel de Supabase:

-- 1. Tabla de Vehículos Activos en Patio
CREATE TABLE IF NOT EXISTS active_vehicles (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  spot_id TEXT,
  entry_time TIMESTAMPTZ NOT NULL,
  charging_mode TEXT,
  hourly_rate NUMERIC DEFAULT 0,
  is_covenant BOOLEAN DEFAULT FALSE,
  covenant_name TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  store_items JSONB DEFAULT '[]'::jsonb,
  wash_order_ids JSONB DEFAULT '[]'::jsonb,
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
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  elapsed_minutes INTEGER,
  parking_fee NUMERIC DEFAULT 0,
  wash_fee NUMERIC DEFAULT 0,
  store_fee NUMERIC DEFAULT 0,
  net_total NUMERIC DEFAULT 0,
  vat_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL,
  item_details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Gastos Operacionales
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Asientos Contables (Libro Diario)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS y políticas públicas para la API
ALTER TABLE active_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura y escritura publica" ON active_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura publica" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura publica" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura publica" ON accounting_entries FOR ALL USING (true) WITH CHECK (true);
`;
