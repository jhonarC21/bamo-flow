import React, { useState, useEffect } from 'react';
import { ActiveVehicle, WashOrder, RateConfig, CarWashService, ParkingSpot } from '../types';
import { calculateParkingFee, formatCurrency, formatDuration, formatTimeOnly } from '../utils/pricing';
import {
  Clock,
  Car,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  DollarSign,
  Search,
  QrCode,
  Share2,
  RefreshCw,
  Bell,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Check,
  ShoppingBag,
  Send,
  Navigation
} from 'lucide-react';

interface LiveVehicleTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlate?: string;
  activeVehicles: ActiveVehicle[];
  washOrders: WashOrder[];
  spots: ParkingSpot[];
  rateConfig: RateConfig;
  washServices: CarWashService[];
}

export const LiveVehicleTrackerModal: React.FC<LiveVehicleTrackerModalProps> = ({
  isOpen,
  onClose,
  initialPlate = '',
  activeVehicles,
  washOrders,
  spots,
  rateConfig,
  washServices,
}) => {
  const [searchPlate, setSearchPlate] = useState<string>(initialPlate);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  
  // Real-time ticking time counter state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Client action simulator
  const [clientOnWayNotified, setClientOnWayNotified] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync initial search plate when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialPlate) {
        setSearchPlate(initialPlate.toUpperCase());
        const match = activeVehicles.find(v => v.plate.toUpperCase() === initialPlate.toUpperCase());
        if (match) {
          setSelectedVehicleId(match.id);
        }
      } else if (activeVehicles.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(activeVehicles[0].id);
        setSearchPlate(activeVehicles[0].plate);
      }
    }
  }, [isOpen, initialPlate, activeVehicles]);

  // Live 1-second ticker loop for real-time cost & duration calculation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Search logic
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchPlate.trim().toUpperCase();
    const match = activeVehicles.find(v => v.plate.toUpperCase() === clean);
    if (match) {
      setSelectedVehicleId(match.id);
    }
  };

  // Currently tracked active vehicle object
  const currentVehicle = activeVehicles.find(v => v.id === selectedVehicleId) ||
    activeVehicles.find(v => v.plate.toUpperCase() === searchPlate.trim().toUpperCase());

  // Associated wash order if any
  const associatedWashOrder = currentVehicle
    ? washOrders.find(
        (o) => o.plate.toUpperCase() === currentVehicle.plate.toUpperCase() && o.status !== 'entregado'
      )
    : null;

  // Associated parking spot
  const currentSpot = currentVehicle ? spots.find((s) => s.id === currentVehicle.spotId) : null;

  // Live real-time calculations
  let elapsedSeconds = 0;
  let elapsedMinutes = 0;
  let parkingFee = 0;
  let storeTotal = 0;
  let washFee = 0;
  let totalFee = 0;

  if (currentVehicle) {
    const entryDate = new Date(currentVehicle.entryTime);
    const diffMs = Math.max(0, currentTime.getTime() - entryDate.getTime());
    elapsedSeconds = Math.floor(diffMs / 1000);
    elapsedMinutes = Math.floor(elapsedSeconds / 60);

    const feeCalculation = calculateParkingFee(
      currentVehicle.entryTime,
      currentVehicle.chargingMode,
      rateConfig,
      currentVehicle.vehicleType
    );

    parkingFee = feeCalculation.parkingFee;
    storeTotal = currentVehicle.attachedStoreItems.reduce((acc, curr) => acc + curr.total, 0);
    washFee = currentVehicle.attachedWashService?.price || associatedWashOrder?.price || 0;
    totalFee = parkingFee + storeTotal + washFee;
  }

  // Format second-precise duration
  const formatLiveDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
  };

  // Wash Progress Steps logic
  const getWashStepIndex = (status?: string) => {
    switch (status) {
      case 'pendiente':
        return 0;
      case 'en_proceso':
        return 1;
      case 'listo':
        return 3; // Ready for pickup!
      case 'entregado':
        return 4;
      default:
        return -1;
    }
  };

  const currentWashStatus = associatedWashOrder?.status || currentVehicle?.attachedWashService?.status;
  const washStepIndex = getWashStepIndex(currentWashStatus);

  const washSteps = [
    { title: 'Ingreso & En Espera', desc: 'Vehículo registrado en cola de atención' },
    { title: 'En Proceso de Lavado', desc: 'Limpieza exterior/interior por operario' },
    { title: 'Detallado & Control', desc: 'Secado con microfibra y silicona' },
    { title: '¡Listo para Retiro!', desc: 'Puede pasar a caja a retirar su vehículo' },
  ];

  const handleCopyTrackingLink = () => {
    if (!currentVehicle) return;
    const url = `${window.location.origin}/?track_plate=${currentVehicle.plate}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0a0a14] rounded-3xl border border-slate-800 w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-[#101022] p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
              <Car className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">Monitoreo de Vehículo en Tiempo Real</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">Consulta de estado, tiempo transcurrido y avance de lavado para el cliente</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* License Plate Search Bar */}
          <div className="bg-[#111122] p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                  placeholder="Ingrese Patente (Ej: AB-1234)..."
                  className="w-full bg-[#080810] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-sm text-indigo-300 font-mono font-bold uppercase outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md"
              >
                Buscar
              </button>
            </form>

            {/* Quick selector if multiple active vehicles */}
            {activeVehicles.length > 0 && (
              <div className="w-full sm:w-auto shrink-0 flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">Activos ({activeVehicles.length}):</span>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    const found = activeVehicles.find(v => v.id === e.target.value);
                    if (found) setSearchPlate(found.plate);
                  }}
                  className="bg-[#080810] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-indigo-300 font-mono font-bold outline-none cursor-pointer max-w-[160px]"
                >
                  <option value="">-- Seleccionar --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.spotId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* MAIN MONITORING DASHBOARD FOR SELECTED VEHICLE */}
          {!currentVehicle ? (
            <div className="text-center py-12 bg-[#111122] rounded-3xl border border-slate-800 p-6 space-y-3">
              <Car className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200">No se encontró ningún vehículo activo con esa patente</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Asegúrese de haber ingresado la patente correctamente o verifique si el vehículo ya fue retirado del recinto.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Ready Alert Banner if wash completed or parked */}
              {currentWashStatus === 'listo' && (
                <div className="bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-emerald-950 border-2 border-emerald-500/80 p-4 rounded-2xl text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-bounce">
                  <div className="flex items-center space-x-3 text-center sm:text-left">
                    <span className="p-2.5 rounded-full bg-emerald-500 text-slate-950 font-black shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-white">¡Su Servicio de Lavado está Completo!</h4>
                      <p className="text-xs text-emerald-300">
                        Su vehículo <strong className="text-white font-mono">{currentVehicle.plate}</strong> se encuentra 100% listo para retiro en caja.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setClientOnWayNotified(true)}
                    disabled={clientOnWayNotified}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-extrabold text-xs cursor-pointer shadow-lg shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{clientOnWayNotified ? '¡Aviso Enviado a Caja!' : 'Avisar que voy a retirar'}</span>
                  </button>
                </div>
              )}

              {/* Main Card Grid: Specs & Live Counters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Vehicle Identity Card */}
                <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehículo Monitoreado</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        {currentVehicle.vehicleType}
                      </span>
                    </div>

                    <div className="mt-2 text-center bg-[#080810] p-3 rounded-xl border border-slate-800">
                      <span className="font-mono text-2xl font-black text-indigo-300 tracking-wider">
                        {currentVehicle.plate}
                      </span>
                      {(currentVehicle.make || currentVehicle.model) && (
                        <p className="text-xs text-slate-300 font-bold mt-1 capitalize">
                          {currentVehicle.make} {currentVehicle.model} {currentVehicle.color && `(${currentVehicle.color})`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-2 pt-2 border-t border-slate-800 text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Ubicación:
                      </span>
                      <span className="font-bold text-white bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                        {currentSpot ? `${currentSpot.zone} - Espacio ${currentSpot.id}` : `Espacio ${currentVehicle.spotId}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Hora Ingreso:
                      </span>
                      <span className="font-mono text-slate-200">{formatTimeOnly(currentVehicle.entryTime)}</span>
                    </div>

                    {currentVehicle.driverName && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Titular / Driver:</span>
                        <span className="font-bold text-slate-200">{currentVehicle.driverName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Live Elapsed Time Counter Card */}
                <div className="bg-[#111122] p-4 rounded-2xl border border-indigo-500/40 space-y-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Tiempo Transcurrido en Vivo
                    </span>

                    <div className="mt-3 text-center bg-[#080810] p-3 rounded-xl border border-indigo-500/30">
                      <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400 tracking-wider block">
                        {formatLiveDuration(elapsedSeconds)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        Actualizándose segundo a segundo
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Modo Cobro:</span>
                      <span className="font-bold text-indigo-300 capitalize">{currentVehicle.chargingMode}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Minutos totales:</span>
                      <span className="font-mono font-bold text-white">{elapsedMinutes} min</span>
                    </div>
                  </div>
                </div>

                {/* 3. Estimated Live Fee Card */}
                <div className="bg-[#111122] p-4 rounded-2xl border border-emerald-500/40 space-y-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Monto Acumulado a Pagar
                    </span>

                    <div className="mt-3 text-center bg-[#080810] p-3 rounded-xl border border-emerald-500/30">
                      <span className="font-mono text-2xl font-black text-emerald-300 block">
                        {formatCurrency(totalFee)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        Total estimado al instante actual
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 pt-2 border-t border-slate-800 text-slate-400">
                    <div className="flex justify-between">
                      <span>Estacionamiento:</span>
                      <span className="font-mono text-slate-200 font-bold">{formatCurrency(parkingFee)}</span>
                    </div>
                    {washFee > 0 && (
                      <div className="flex justify-between text-indigo-300 font-bold">
                        <span>Lavado:</span>
                        <span className="font-mono">{formatCurrency(washFee)}</span>
                      </div>
                    )}
                    {storeTotal > 0 && (
                      <div className="flex justify-between text-amber-300 font-bold">
                        <span>Consumos Tienda:</span>
                        <span className="font-mono">{formatCurrency(storeTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* REAL-TIME CAR WASH STEPPER (If wash order or wash service attached) */}
              {(currentVehicle.attachedWashService || associatedWashOrder) && (
                <div className="bg-[#111122] p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h4 className="font-extrabold text-white text-xs">
                        Avance del Servicio de Lavado:{' '}
                        <span className="text-indigo-300">
                          {currentVehicle.attachedWashService?.serviceName || associatedWashOrder?.serviceName}
                        </span>
                      </h4>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      Estado: {currentWashStatus || 'En curso'}
                    </span>
                  </div>

                  {/* Stepper Graphic */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    {washSteps.map((step, idx) => {
                      const isCompleted = washStepIndex > idx;
                      const isCurrent = washStepIndex === idx;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                            isCompleted
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : isCurrent
                              ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                              : 'bg-[#080810] border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono">Paso 0{idx + 1}</span>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : isCurrent ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
                            ) : null}
                          </div>

                          <div>
                            <h5 className="font-extrabold text-xs">{step.title}</h5>
                            <p className="text-[10px] opacity-80 mt-0.5 leading-tight">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STORE ITEMS CONSUMED IN PARKING LOT */}
              {currentVehicle.attachedStoreItems.length > 0 && (
                <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>Consumos Agregados en Tienda / Cafetería ({currentVehicle.attachedStoreItems.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentVehicle.attachedStoreItems.map((st, i) => (
                      <div key={i} className="bg-[#080810] p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-200">{st.item.name}</span>
                          <span className="text-slate-400 text-[10px] block">x{st.quantity} unidad(es)</span>
                        </div>
                        <span className="font-mono font-bold text-amber-400">{formatCurrency(st.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHAREABLE TRACKING LINK & QR CODE FOOTER */}
              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="font-bold text-slate-200 flex items-center justify-center sm:justify-start gap-1">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    Enlace de Monitoreo Compartible
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Envíe este link a su teléfono para consultar este panel en cualquier momento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyTrackingLink}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer flex items-center gap-1.5 border border-slate-700 shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">¡Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-indigo-400" />
                      <span>Copiar Enlace Directo</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-[#101022] p-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            Cerrar Monitoreo
          </button>
        </div>

      </div>
    </div>
  );
};
