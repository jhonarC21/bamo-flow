import { createClient } from '@supabase/supabase-js';

// Inicializar el cliente nativo de Supabase con tus variables de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ADAPTADOR MAESTRO
export const const_db = {}; 

// Guardar o actualizar en Supabase
export const setDoc = async (docRef: any, data: any) => {
  const spotId = docRef?.id || data?.spot_id || data?.space;
  
  // Guardamos el objeto exacto que envía la app en la columna data para no perder nada
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

// Escucha en tiempo real multidispositivo ultra-compatible
export const onSnapshot = (docRef: any, callback: any) => {
  const targetId = docRef?.id;

  const consultarYEnviar = async () => {
    const { data } = await supabase.from('active_vehicles').select('*');
    if (data) {
      const state: any = {};
      
      // Mapeamos los datos en dos formatos a la vez para asegurar compatibilidad
      data.forEach(item => {
        if (item.id) {
          // Formato 1: Guardado directo en la raíz del ID
          state[item.id] = item.data || item;
          // Formato 2: Si tu código busca dentro de un sub-objeto 'vehicles'
          if (!state.vehicles) state.vehicles = {};
          state.vehicles[item.id] = item.data || item;
          // Formato 3: Si tu código busca dentro de un sub-objeto 'spots'
          if (!state.spots) state.spots = {};
          state.spots[item.id] = item.data || item;
        }
      });

      // Si es el estado general o la app busca el documento maestro
      if (targetId === 'main_app_state' || !targetId) {
        callback({
          exists: () => true,
          data: () => state
        });
      } else {
        // Consulta de tarjeta individual
        const especifico = state[targetId] || (state.vehicles && state.vehicles[targetId]);
        callback({
          exists: () => !!especifico,
          data: () => especifico || null
        });
      }
    }
  };

  consultarYEnviar();

  const channel = supabase
    .channel(public:active_vehicles:${targetId || 'global'})
    .on('postgres_changes', { event: '*', schema: 'public', table: 'active_vehicles' }, () => {
      consultarYEnviar();
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

// Funciones complementarias para mantener compatibilidad
export const initializeApp = () => ({});
export const getApps = () => [];
export const getApp = () => ({});
export const getFirestore = () => ({});
export const doc = (db: any, col: string, id: string) => ({ id, col });
export const collection = () => ({});
export const getDoc = async (docRef: any) => {
  const targetId = docRef?.id;
  const { data } = await supabase.from('active_vehicles').select('*');
  const state: any = { vehicles: {}, spots: {} };
  if (data) {
    data.forEach(item => { 
      if (item.id) {
        state[item.id] = item.data || item;
        state.vehicles[item.id] = item.data || item;
        state.spots[item.id] = item.data || item;
      }
    });
  }
  const especifico = state[targetId] || state.vehicles[targetId];
  return {
    exists: () => !!especifico,
    data: () => especifico || null
  };
};
