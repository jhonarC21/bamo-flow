import { createClient } from '@supabase/supabase-js';

// Inicializar el cliente nativo de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const const_db = {}; 

// Guardar o actualizar datos en la nube
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

  if (error) console.error("Error al guardar:", error);
};

// Sincronización optimizada para navegadores de escritorio y celulares
export const onSnapshot = (docRef: any, callback: any) => {
  const targetId = docRef?.id;

  const emitirDatos = (listaVehiculos: any[]) => {
    const state: any = { vehicles: {}, spots: {} };
    
    listaVehiculos.forEach(item => {
      if (item.id) {
        const payload = item.data || item;
        state[item.id] = payload;
        state.vehicles[item.id] = payload;
        state.spots[item.id] = payload;
      }
    });

    if (targetId === 'main_app_state' || !targetId) {
      callback({ exists: () => true, data: () => state });
    } else {
      const especifico = state[targetId] || state.vehicles[targetId] || state.spots[targetId];
      callback({ exists: () => !!especifico, data: () => especifico || null });
    }
  };

  // Primera carga de datos
  supabase.from('active_vehicles').select('*').then(({ data }) => {
    if (data) emitirDatos(data);
  });

  // Escucha activa Realtime (Mismo canal simplificado para evitar bloqueos en móvil)
  const channel = supabase
    .channel('cambios-estacionamiento')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'active_vehicles' }, (payload) => {
      // En vez de reconsultar todo, refrescamos la vista de inmediato
      supabase.from('active_vehicles').select('*').then(({ data }) => {
        if (data) emitirDatos(data);
      });
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

// Mantener compatibilidad del sistema
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
        const payload = item.data || item;
        state[item.id] = payload;
        state.vehicles[item.id] = payload;
      }
    });
  }
  const especifico = state[targetId] || state.vehicles[targetId];
  return { exists: () => !!especifico, data: () => especifico || null };
};
