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

// Escucha en tiempo real filtrada por cada espacio individual
export const onSnapshot = (docRef: any, callback: any) => {
  const targetId = docRef?.id; // Identifica qué espacio se está consultando (ej: 'main_app_state')

  const consultarYEnviar = async () => {
    const { data } = await supabase.from('active_vehicles').select('*');
    if (data) {
      const state: any = {};
      data.forEach(item => {
        if (item.id) state[item.id] = item.data || item;
      });

      // Si el frontend pregunta por el estado global de la app
      if (targetId === 'main_app_state' || !targetId) {
        callback({
          exists: () => Object.keys(state).length > 0,
          data: () => state
        });
      } else {
        // Si pregunta por un espacio específico (ej: Espacio A1)
        const especifico = state[targetId];
        callback({
          exists: () => !!especifico,
          data: () => especifico || null
        });
      }
    }
  };

  consultarYEnviar();

  // Suscribirse a los cambios de Supabase Realtime
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
  const state: any = {};
  if (data) {
    data.forEach(item => { if (item.id) state[item.id] = item.data || item; });
  }
  const especifico = state[targetId];
  return {
    exists: () => !!especifico,
    data: () => especifico || null
  };
};
