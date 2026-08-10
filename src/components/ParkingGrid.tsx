import React, { useState } from 'react';
import { ActiveVehicle, ParkingSpot, RateConfig, VehicleType } from '../types';
import { calculateParkingFee, formatCurrency, formatDuration, formatTimeOnly } from '../utils/pricing';
import { Car, Clock, DollarSign, LogOut, Plus, ShoppingCart, Sparkles, Tag, User, Edit3, Trash2, QrCode, X } from 'lucide-react';

interface ParkingGridProps {
  spots: ParkingSpot[];
  activeVehicles: ActiveVehicle[];
  config: RateConfig;
  onSelectSpotToPark: (spotId: string) => void;
  onOpenCheckout: (vehicle: ActiveVehicle) => void;
  onQuickAttachStore: (vehicle: ActiveVehicle) => void;
  onQuickAttachWash: (vehicle: ActiveVehicle) => void;
  onPrintTicket: (vehicle: ActiveVehicle) => void;
  onEditEntryTime: (vehicle: ActiveVehicle) => void;
  onDeleteVehicleService: (vehicle: ActiveVehicle) => void;
  onShowQR: (vehicle: ActiveVehicle) => void;
  onAddSpot?: (spot: ParkingSpot) => void;
  onUpdateSpot?: (spot: ParkingSpot) => void;
  onDeleteSpot?: (spotId: string) => void;
  onSetTotalSpotsCount?: (newCount: number) => void;
}

const vehicleTypeLabels: Record<VehicleType, { label: string; icon: string; bg: string }> = {
  auto: { label: 'Auto', icon: '🚗', bg: 'bg-blue-100 text-blue-800' },
  suv: { label: 'SUV', icon: '🚙', bg: 'bg-indigo-100 text-indigo-800' },
  camioneta: { label: 'Camioneta', icon: '🛻', bg: 'bg-amber-100 text-amber-800' },
  moto: { label: 'Moto', icon: '🏍️', bg: 'bg-emerald-100 text-emerald-800' },
  furgon: { label: 'Furgón', icon: '🚐', bg: 'bg-purple-100 text-purple-800' },
};

export const ParkingGrid: React.FC<ParkingGridProps> = ({
  spots,
  activeVehicles,
  config,
  onSelectSpotToPark,
  onOpenCheckout,
  onQuickAttachStore,
  onQuickAttachWash,
  onPrintTicket,
  onEditEntryTime,
  onDeleteVehicleService,
  onShowQR,
  onAddSpot,
  onUpdateSpot,
  onDeleteSpot,
  onSetTotalSpotsCount,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<'todos' | 'diurno' | 'nocturno'>('todos');

  // Spots management modal state
  const [isSpotsModalOpen, setIsSpotsModalOpen] = useState(false);
  const [desiredCapacity, setDesiredCapacity] = useState<number>(spots.length);
  const [newSpotId, setNewSpotId] = useState('');
  const [newSpotZone, setNewSpotZone] = useState('Sector A');
  const [newSpotTypes, setNewSpotTypes] = useState<VehicleType[]>(['auto', 'suv', 'camioneta']);
  const [newSpotNightly, setNewSpotNightly] = useState(false);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);

  // Sync desiredCapacity when spots change or modal opens
  const handleOpenSpotsModal = () => {
    setDesiredCapacity(spots.length);
    setIsSpotsModalOpen(true);
  };

  const handleApplyCapacityChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSetTotalSpotsCount) {
      onSetTotalSpotsCount(desiredCapacity);
    }
  };

  const handleCreateCustomSpot = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newSpotId.trim().toUpperCase();
    if (!cleanId) return;

    if (spots.some((s) => s.id.toUpperCase() === cleanId)) {
      alert(`El puesto "${cleanId}" ya existe.`);
      return;
    }

    if (onAddSpot) {
      onAddSpot({
        id: cleanId,
        zone: newSpotZone.trim() || 'Sector A',
        typeAllowed: newSpotTypes.length > 0 ? newSpotTypes : ['auto', 'suv'],
        status: 'disponible',
        isNightlySpot: newSpotNightly,
      });
    }

    setNewSpotId('');
  };

  const handleToggleVehicleTypeInNewSpot = (type: VehicleType) => {
    if (newSpotTypes.includes(type)) {
      if (newSpotTypes.length === 1) return; // keep at least 1
      setNewSpotTypes(newSpotTypes.filter((t) => t !== type));
    } else {
      setNewSpotTypes([...newSpotTypes, type]);
    }
  };

  // Unique zones
  const zones = Array.from(new Set(spots.map((s) => s.zone)));

  const filteredSpots = spots.filter((spot) => {
    const vehicle = activeVehicles.find((v) => v.spotId === spot.id || v.id === spot.currentVehicleId);
    
    if (selectedZone !== 'todos' && spot.zone !== selectedZone) return false;
    if (selectedStatus === 'disponibles' && spot.status !== 'disponible') return false;
    if (selectedStatus === 'ocupadas' && spot.status !== 'ocupado') return false;
    
    if (categoryFilter === 'nocturno') {
      if (spot.isNightlySpot) return true;
      if (vehicle && (vehicle.isNightlyRental || vehicle.chargingMode === 'nocturno')) return true;
      return false;
    }
    if (categoryFilter === 'diurno') {
      if (vehicle && (vehicle.isNightlyRental || vehicle.chargingMode === 'nocturno')) return false;
    }
    return true;
  });

  const nightlyActiveCount = activeVehicles.filter(v => v.isNightlyRental || v.chargingMode === 'nocturno').length;

  return (
    <div className="space-y-6">
      
      {/* Controls & Filters Bar */}
      <div className="bg-[#0d0d1a] p-4 rounded-2xl border border-slate-800/60 shadow-xl shadow-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Main Category Sub-Filter: Todos / Diurno / Arriendo Nocturno */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Modalidad:</span>
          <button
            onClick={() => setCategoryFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              categoryFilter === 'todos'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setCategoryFilter('diurno')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              categoryFilter === 'diurno'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            ☀️ Rotación Diurna
          </button>
          <button
            onClick={() => setCategoryFilter('nocturno')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              categoryFilter === 'nocturno'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/30'
                : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-500/30'
            }`}
          >
            🌙 Arriendo Nocturno / Pernocte ({nightlyActiveCount})
          </button>
        </div>

        {/* Zone Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Zona:</span>
          <button
            onClick={() => setSelectedZone('todos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              selectedZone === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            Todas ({spots.length})
          </button>
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedZone === z ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado:</span>
          <button
            onClick={() => setSelectedStatus('todos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              selectedStatus === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedStatus('disponibles')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              selectedStatus === 'disponibles' ? 'bg-emerald-600 text-white' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            Libres ({spots.filter((s) => s.status === 'disponible').length})
          </button>
          <button
            onClick={() => setSelectedStatus('ocupadas')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              selectedStatus === 'ocupadas' ? 'bg-amber-600 text-white' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            Ocupadas ({spots.filter((s) => s.status === 'ocupado').length})
          </button>
        </div>

        {/* Modify Spots Button */}
        <button
          onClick={handleOpenSpotsModal}
          className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm hover:border-indigo-400"
        >
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span>⚙️ Modificar Puestos ({spots.length})</span>
        </button>

      </div>

      {/* Grid of Spots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSpots.map((spot) => {
          const vehicle = activeVehicles.find((v) => v.spotId === spot.id || v.id === spot.currentVehicleId);
          const isOccupied = spot.status === 'ocupado' && vehicle;

          if (!isOccupied) {
            return (
              <div
                key={spot.id}
                onClick={() => onSelectSpotToPark(spot.id)}
                className="group bg-[#0d0d1a] rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/60 hover:bg-emerald-950/10 p-4.5 transition-all duration-200 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xl shadow-black/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-lg text-slate-200 group-hover:text-emerald-400 transition-colors">
                    Espacio {spot.id}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    DISPONIBLE
                  </span>
                </div>

                <div className="my-3 text-center py-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/50 group-hover:bg-emerald-950/60 group-hover:border-emerald-500/40 flex items-center justify-center mx-auto text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-2 group-hover:text-slate-200 transition-colors">Haga clic para estacionar</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span className="font-semibold">{spot.zone}</span>
                  <span>Apto: {spot.typeAllowed.join(', ').toUpperCase()}</span>
                </div>
              </div>
            );
          }

          // Occupied spot card logic
          const feeResult = calculateParkingFee(vehicle.entryTime, vehicle.chargingMode, config, vehicle.vehicleType);
          const storeTotal = vehicle.attachedStoreItems.reduce((acc, curr) => acc + curr.total, 0);
          const washTotal = vehicle.attachedWashService?.price || 0;
          const grandTotal = feeResult.parkingFee + storeTotal + washTotal;

          const typeInfo = vehicleTypeLabels[vehicle.vehicleType] || vehicleTypeLabels.auto;
          const isNightly = vehicle.isNightlyRental || vehicle.chargingMode === 'nocturno';

          return (
            <div
              key={spot.id}
              className={`bg-[#0d0d1a] rounded-2xl border shadow-xl transition-all p-4.5 flex flex-col justify-between min-h-[260px] relative overflow-hidden space-y-3 ${
                isNightly
                  ? 'border-purple-500/60 shadow-purple-950/30 bg-gradient-to-b from-[#120a22] to-[#0d0d1a]'
                  : 'border-indigo-500/30 shadow-indigo-950/20 hover:border-indigo-500/60'
              }`}
            >
              {/* Header: Spot & Plate */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-mono font-bold text-xs bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-md">
                    {spot.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700/60">
                    {typeInfo.icon} {typeInfo.label}
                  </span>
                  {isNightly && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-500/50 flex items-center gap-1">
                      🌙 PERNOCTE
                    </span>
                  )}
                </div>
                
                {/* Management Bar: Modify Time, QR Code, Delete */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onShowQR(vehicle)}
                    className="p-1 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 cursor-pointer transition-colors"
                    title="Ver Código QR del Vehículo"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onEditEntryTime(vehicle)}
                    className="p-1 rounded-lg bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-500/40 cursor-pointer transition-colors"
                    title="Modificar Hora de Ingreso"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteVehicleService(vehicle)}
                    className="p-1 rounded-lg bg-red-950/90 hover:bg-red-900 text-red-400 border border-red-500/40 cursor-pointer transition-colors"
                    title="Eliminar Servicio / Retirar sin cobro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* License Plate Display */}
              <div className="bg-[#050508] border-2 border-slate-800/80 rounded-xl p-2.5 text-center shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1 uppercase tracking-widest mb-0.5">
                  <span>SISTEMA</span>
                  <span className="text-indigo-400 font-mono">
                    {vehicle.chargingMode === 'nocturno' ? '🌙 NOCTURNO' : vehicle.chargingMode === 'tramo' ? 'TRAMO' : 'MINUTO'}
                  </span>
                </div>
                <div className="font-mono text-2xl font-black tracking-widest text-indigo-300">
                  {vehicle.plate}
                </div>
                {vehicle.driverName && (
                  <div className="text-[11px] text-slate-400 font-medium mt-1 truncate flex items-center justify-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    {vehicle.driverName}
                  </div>
                )}
              </div>

              {/* Time & Accrued Fee */}
              <div className="bg-[#111122] rounded-xl p-3 text-xs space-y-2 border border-slate-800/60">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ingreso: {formatTimeOnly(vehicle.entryTime)}</span>
                  </span>
                  <span className="font-bold text-indigo-300 font-mono">
                    ⏱️ {formatDuration(feeResult.elapsedMinutes)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400 font-medium">Estacionamiento:</span>
                  <span className="font-mono font-bold text-slate-200">{formatCurrency(feeResult.parkingFee)}</span>
                </div>

                {/* Additional Attached Services summary */}
                {(storeTotal > 0 || washTotal > 0) && (
                  <div className="text-[11px] space-y-0.5 pt-1 border-t border-slate-800/60">
                    {storeTotal > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>🛒 Tienda ({vehicle.attachedStoreItems.length} prod):</span>
                        <span className="font-mono font-bold">+{formatCurrency(storeTotal)}</span>
                      </div>
                    )}
                    {washTotal > 0 && (
                      <div className="flex justify-between text-indigo-400">
                        <span>🧼 Lavado ({vehicle.attachedWashService?.status}):</span>
                        <span className="font-mono font-bold">+{formatCurrency(washTotal)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-emerald-400">
                  <span>TOTAL ACTUAL:</span>
                  <span className="font-mono text-base">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="mt-2 grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onQuickAttachStore(vehicle)}
                  className="bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700/60 p-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer"
                  title="Añadir artículo de tienda a la cuenta"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
                  <span>+Tienda</span>
                </button>

                <button
                  onClick={() => onQuickAttachWash(vehicle)}
                  className="bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700/60 p-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer"
                  title="Añadir o ver lavado de auto"
                >
                  <Sparkles className="w-3.5 h-3.5 mb-0.5 text-indigo-400" />
                  <span>+Lavado</span>
                </button>

                <button
                  onClick={() => onPrintTicket(vehicle)}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 p-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer"
                  title="Ver Ticket de Ingreso"
                >
                  <Tag className="w-3.5 h-3.5 mb-0.5 text-slate-400" />
                  <span>Ticket</span>
                </button>

                <button
                  onClick={() => onOpenCheckout(vehicle)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 p-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer shadow-lg shadow-indigo-900/50"
                  title="Realizar cobro y liberar espacio"
                >
                  <LogOut className="w-3.5 h-3.5 mb-0.5" />
                  <span>Cobrar</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Spots Management Modal */}
      {isSpotsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d0d1a] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-slate-800 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-slate-100">Modificar Puestos de Estacionamiento</h3>
              </div>
              <button onClick={() => setIsSpotsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Quick Capacity Adjuster */}
            <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Ajustar Capacidad Total</h4>
                  <p className="text-[11px] text-slate-400">Aumente o reduzca la cantidad total de puestos del patio en lote.</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-1 rounded-xl">
                  Actual: {spots.length} puestos
                </span>
              </div>

              <form onSubmit={handleApplyCapacityChange} className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1 bg-[#0d0d1a] border border-slate-700/80 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setDesiredCapacity((c) => Math.max(1, c - 5))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesiredCapacity((c) => Math.max(1, c - 1))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    -1
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={desiredCapacity}
                    onChange={(e) => setDesiredCapacity(parseInt(e.target.value) || 1)}
                    className="w-16 bg-transparent text-center font-mono font-bold text-sm text-indigo-300 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setDesiredCapacity((c) => c + 1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesiredCapacity((c) => c + 5)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    +5
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={desiredCapacity === spots.length}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    desiredCapacity !== spots.length
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Aplicar Nueva Cantidad ({desiredCapacity})
                </button>
              </form>
            </div>

            {/* Section 2: Create Custom Spot */}
            <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Agregar Puesto Personalizado</h4>
              
              <form onSubmit={handleCreateCustomSpot} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Identificador de Espacio *</label>
                    <input
                      type="text"
                      value={newSpotId}
                      onChange={(e) => setNewSpotId(e.target.value)}
                      placeholder="Ej: A6, B5, VIP3, C1"
                      className="w-full bg-[#0d0d1a] border border-slate-700/60 rounded-xl p-2.5 font-bold text-white outline-none focus:border-indigo-500 uppercase font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Sector / Zona *</label>
                    <input
                      type="text"
                      value={newSpotZone}
                      onChange={(e) => setNewSpotZone(e.target.value)}
                      placeholder="Ej: Sector A, Sector VIP, Motos"
                      className="w-full bg-[#0d0d1a] border border-slate-700/60 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tipos de Vehículos Permitidos</label>
                  <div className="flex flex-wrap gap-2">
                    {(['auto', 'suv', 'camioneta', 'furgon', 'moto'] as VehicleType[]).map((vt) => {
                      const isSel = newSpotTypes.includes(vt);
                      return (
                        <button
                          key={vt}
                          type="button"
                          onClick={() => handleToggleVehicleTypeInNewSpot(vt)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all ${
                            isSel
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {vehicleTypeLabels[vt]?.icon} {vehicleTypeLabels[vt]?.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newSpotNightly"
                    checked={newSpotNightly}
                    onChange={(e) => setNewSpotNightly(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 border-slate-700 focus:ring-purple-500 bg-[#0d0d1a]"
                  />
                  <label htmlFor="newSpotNightly" className="text-purple-300 font-bold cursor-pointer select-none">
                    🌙 Habilitado para Arriendo Nocturno / Pernocte
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Puesto {newSpotId.toUpperCase()}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Section 3: List & Individual Edit/Delete of Existing Spots */}
            <div>
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
                Listado de Puestos Existentes ({spots.length})
              </h4>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {spots.map((spot) => {
                  const vehicle = activeVehicles.find((v) => v.spotId === spot.id || v.id === spot.currentVehicleId);
                  const isOccupied = spot.status === 'ocupado' || !!vehicle;

                  if (editingSpot?.id === spot.id) {
                    return (
                      <div key={spot.id} className="bg-[#111122] p-3 rounded-xl border border-indigo-500/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-indigo-300">
                          <span>Editando Puesto {spot.id}</span>
                          <button onClick={() => setEditingSpot(null)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold">Zona/Sector</label>
                            <input
                              type="text"
                              value={editingSpot.zone}
                              onChange={(e) => setEditingSpot({ ...editingSpot, zone: e.target.value })}
                              className="w-full bg-[#0d0d1a] border border-slate-700 rounded-lg p-1.5 text-white font-bold"
                            />
                          </div>
                          <div className="flex items-center pt-4 gap-2">
                            <input
                              type="checkbox"
                              id={`editNightly-${spot.id}`}
                              checked={!!editingSpot.isNightlySpot}
                              onChange={(e) => setEditingSpot({ ...editingSpot, isNightlySpot: e.target.checked })}
                              className="w-4 h-4 rounded text-purple-600 bg-[#0d0d1a]"
                            />
                            <label htmlFor={`editNightly-${spot.id}`} className="text-purple-300 font-bold text-[11px]">
                              Pernocte
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingSpot(null)}
                            className="px-3 py-1 rounded-lg border border-slate-700 text-slate-300 font-bold"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              if (onUpdateSpot && editingSpot) {
                                onUpdateSpot(editingSpot);
                                setEditingSpot(null);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={spot.id}
                      className="bg-[#111122] p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-sm text-indigo-300 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                          {spot.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{spot.zone}</span>
                            {spot.isNightlySpot && (
                              <span className="text-[10px] font-bold bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                🌙 Pernocte
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Apto: {spot.typeAllowed.join(', ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOccupied ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-500/30">
                            Ocupado ({vehicle?.plate})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            Disponible
                          </span>
                        )}

                        {onUpdateSpot && (
                          <button
                            onClick={() => setEditingSpot(spot)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white cursor-pointer transition-colors"
                            title="Modificar puesto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeleteSpot && (
                          <button
                            onClick={() => {
                              if (isOccupied) {
                                alert(`No se puede eliminar el puesto ${spot.id} porque está ocupado.`);
                                return;
                              }
                              if (confirm(`¿Eliminar puesto de estacionamiento ${spot.id}?`)) {
                                onDeleteSpot(spot.id);
                              }
                            }}
                            disabled={isOccupied}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isOccupied
                                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white'
                            }`}
                            title={isOccupied ? 'No se puede eliminar un puesto ocupado' : 'Eliminar puesto'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-800 pb-1">
              <button
                onClick={() => setIsSpotsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-indigo-900/40"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
