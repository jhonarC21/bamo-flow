import { createClient } from '@supabase/supabase-js';

// Inicializar el cliente nativo de Supabase con tus variables de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ADAPTADOR MAESTRO: Desvía las funciones de Firebase hacia Supabase
export const const_db = {}; 

// Simulación de guardado para que tu frontend no se rompa y guarde en Supabase
export const setDoc = async (docRef: any, data: any) => {
  const spotId = docRef?.id || data?.spot_id || data?.space;
  
  const { error } = await supabase
    .from('active_vehicles')
    .upsert({
      id: spotId,
      patent: data?.patent || data?.plate || '',
      plate: data?.patent || data?.plate || '',
      space: data?.space || data?.spot_id || '',
      spot_id: data?.space || data?.spot_id || '',
      modality: data?.modality || '',
      attached_wash_service: data?.attached_wash_service || '',
      charging_mode: data?.charging_mode || '',
      brand: data?.brand || '',
      model: data?.model || '',
      color: data?.color || '',
      driver_name: data?.driver_name || '',
      driver_phone: data?.driver_phone || '',
      entry_time: data?.entry_time || '',
      notes: data?.notes || '',
      data: data
    });

  if (error) console.error("Error en adaptador Supabase:", error);
};

export const onSnapshot = (docRef: any, callback: any) => {
  const consultarYEnviar = async () => {
    const { data } = await supabase.from('active_vehicles').select('*');
    if (data) {
      const state: any = {};
      data.forEach(item => {
        if (item.id) state[item.id] = item.data || item;
      });
      callback({ 
        exists: () => Object.keys(state).length > 0,
        data: () => state 
      });
    }
  };

  consultarYEnviar();

  const channel = supabase
    .channel('public:active_vehicles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'active_vehicles' }, () => {
      consultarYEnviar();
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

  return () => { supabase.removeChannel(channel); };
};

// Otras funciones vacías para que el compilador de Vite no tire error
export const initializeApp = () => ({});
export const getApps = () => [];
export const getApp = () => ({});
export const getFirestore = () => ({});
export const doc = (db: any, col: string, id: string) => ({ id, col });
export const collection = () => ({});
export const getDoc = async () => ({ exists: () => false, data: () => null });
