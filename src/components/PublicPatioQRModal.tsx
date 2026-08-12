import React, { useState } from 'react';
import { ParkingSpot, ActiveVehicle, RateConfig, CarWashService, WashOrder } from '../types';
import { calculateParkingFee, formatCurrency, formatDuration, formatTimeOnly } from '../utils/pricing';
import {
  X,
  QrCode,
  Car,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Eye,
  RefreshCw,
  Zap,
  HelpCircle
} from 'lucide-react';

interface PublicPatioQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: ParkingSpot[];
  activeVehicles: ActiveVehicle[];
  rateConfig: RateConfig;
  washServices: CarWashService[];
  washOrders?: WashOrder[];
}

export const PublicPatioQRModal: React.FC<PublicPatioQRModalProps> = ({
  isOpen,
  onClose,
  spots,
  activeVehicles,
  rateConfig,
  washServices,
  washOrders = [],
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'grid' | 'search' | 'tariffs'>('qr');
  const [searchPlate, setSearchPlate] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('todos');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?view=patio_qr`
    : `https://autopark.app/?view=patio_qr`;

  // Helper to determine spot occupancy by cross-referencing status and activeVehicles
  const getSpotOccupancy = (spot: ParkingSpot) => {
    const sId = spot.id.trim().toUpperCase();
    const sLabel = (spot.label || '').trim().toUpperCase();
    const sIdClean = sId.replace(/[^A-Z0-9]/g, '');

    const matchingVehicle = activeVehicles.find((v) => {
      if (!v.spotId && !spot.currentVehicleId) return false;
      if (spot.currentVehicleId && v.id === spot.currentVehicleId) return true;
      if (!v.spotId) return false;

      const vSpot = v.spotId.trim().toUpperCase();
      const vSpotClean = vSpot.replace(/[^A-Z0-9]/g, '');

      return (
        vSpot === sId ||
        (sLabel && vSpot === sLabel) ||
        (sIdClean.length > 0 && vSpotClean === sIdClean) ||
        (spot.vehiclePlate && v.plate && spot.vehiclePlate.trim().toUpperCase() === v.plate.trim().toUpperCase())
      );
    });

    const isOccupied = spot.status === 'ocupado' || !!matchingVehicle;
    return { isOccupied, matchingVehicle };
  };

  // Calculate statistics
  const totalSpots = spots.length;
  const occupiedSpotsCount = spots.filter((s) => getSpotOccupancy(s).isOccupied).length;
  const freeSpotsCount = Math.max(0, totalSpots - occupiedSpotsCount);
  const occupancyPercentage = totalSpots > 0 ? Math.round((occupiedSpotsCount / totalSpots) * 100) : 0;

  // Filter spots by zone
  const zones = Array.from(new Set(spots.map(s => s.zone || 'Sector A')));
  const filteredSpots = spots.filter(s => {
    if (selectedZone !== 'todos' && s.zone !== selectedZone) return false;
    return true;
  });

  // Plate search result
  const searchedVehicle = searchPlate.trim()
    ? activeVehicles.find(v => v.plate.toUpperCase().includes(searchPlate.trim().toUpperCase()))
    : null;

  const searchedWashOrder = searchedVehicle
    ? washOrders.find(w => w.plate.toUpperCase() === searchedVehicle.plate.toUpperCase() && w.status !== 'entregado')
    : null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-110 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0b0b18] border border-indigo-500/40 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-[#101024] p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/60">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">
                  Información Pública del Patio & Código QR
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  Solo Lectura
                </span>
              </div>
              <p className="text-xs text-indigo-300/80">
                Visualización en tiempo real para clientes sin necesidad de clave o acceso al sistema
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#080812] px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'qr'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Código QR del Patio</span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'grid'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Mapa del Patio ({freeSpotsCount} Libres)</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Consultar por Patente</span>
          </button>

          <button
            onClick={() => setActiveTab('tariffs')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'tariffs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Tarifas y Servicios</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">

          {/* Realtime summary banner across all tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#121226] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Espacios Libres</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">{freeSpotsCount}</span>
              </div>
            </div>

            <div className="bg-[#121226] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-500/30">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Ocupados</span>
                <span className="text-xl font-extrabold text-rose-400 font-mono">{occupiedSpotsCount}</span>
              </div>
            </div>

            <div className="bg-[#121226] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Puestos</span>
                <span className="text-xl font-extrabold text-indigo-300 font-mono">{totalSpots}</span>
              </div>
            </div>

            <div className="bg-[#121226] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Ocupación</span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">{occupancyPercentage}%</span>
              </div>
            </div>
          </div>

          {/* TAB 1: QR CODE DISPLAY */}
          {activeTab === 'qr' && (
            <div className="bg-[#101024] p-6 rounded-3xl border border-indigo-500/30 text-center space-y-6 max-w-xl mx-auto shadow-2xl">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">Código QR del Patio de Estacionamiento</h3>
                <p className="text-xs text-indigo-300">
                  Escanee con la cámara de su celular para guardar esta vista pública de disponibilidad y estado en tiempo real.
                </p>
              </div>

              {/* QR Image */}
              <div className="bg-white p-4 rounded-3xl inline-block border-4 border-indigo-500/40 shadow-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(publicUrl)}`}
                  alt="QR Patio Estacionamiento"
                  className="w-52 h-52 object-contain"
                />
              </div>

              <div className="bg-[#080814] p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acceso Abierto a Clientes - Sin Contraseña</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Permite consultar puestos libres, tarifas oficiales y monitorear vehículos estacionados sin ingresar al panel administrativo.
                </p>
                <div className="font-mono text-[11px] text-indigo-300 bg-black/50 p-2 rounded-xl border border-slate-800/80 break-all">
                  {publicUrl}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span>{copied ? '¡Enlace Copiado!' : 'Copiar Link Público'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir QR para Cartel Patio</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PATIO MAP & SPOTS GRID */}
          {activeTab === 'grid' && (
            <div className="space-y-4">
              
              {/* Zone filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#101024] p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-slate-400 font-bold mr-1">Filtrar Sector:</span>
                  <button
                    onClick={() => setSelectedZone('todos')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                      selectedZone === 'todos'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({spots.length})
                  </button>
                  {zones.map((z) => (
                    <button
                      key={z}
                      onClick={() => setSelectedZone(z)}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                        selectedZone === z
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Libre
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Ocupado
                  </span>
                </div>
              </div>

              {/* Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredSpots.map((spot) => {
                  const { isOccupied, matchingVehicle } = getSpotOccupancy(spot);
                  const assignedVehicle = matchingVehicle || (spot.vehiclePlate
                    ? activeVehicles.find(v => v.plate.toUpperCase() === spot.vehiclePlate?.toUpperCase())
                    : activeVehicles.find(v => v.spotId === spot.id));

                  return (
                    <div
                      key={spot.id}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${
                        isOccupied
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                          : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm tracking-wider font-mono bg-black/40 px-2 py-0.5 rounded-lg border border-slate-800">
                          {spot.label || spot.id}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isOccupied ? 'bg-rose-950 text-rose-300 border border-rose-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isOccupied ? 'Ocupado' : 'Disponible'}
                        </span>
                      </div>

                      <div className="py-1">
                        {isOccupied ? (
                          <div className="space-y-1">
                            <span className="font-mono font-black text-sm text-white block">
                              {spot.vehiclePlate || assignedVehicle?.plate || 'Vehículo'}
                            </span>
                            <span className="text-[10px] text-rose-300/80 block capitalize">
                              {spot.vehicleType || assignedVehicle?.vehicleType || 'Auto'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-center py-2 text-emerald-400/70 font-bold text-xs flex flex-col items-center gap-1">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>Listo para usar</span>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 flex justify-between items-center">
                        <span>{spot.zone || 'Sector A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: SEARCH BY LICENSE PLATE */}
          {activeTab === 'search' && (
            <div className="space-y-5 max-w-xl mx-auto">
              
              <div className="bg-[#101024] p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-white">Consulta de Vehículo por Patente</h3>
                  <p className="text-xs text-slate-400">
                    Ingrese la patente de su vehículo para conocer su espacio asignado, hora de ingreso y valor acumulado.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-5 h-5 text-indigo-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    placeholder="Ingrese Patente (Ej: AB-1234)..."
                    className="w-full bg-[#050510] border border-slate-700 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3 text-lg text-indigo-200 font-mono font-bold uppercase outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Result card */}
              {searchPlate.trim() && (
                searchedVehicle ? (
                  <div className="bg-[#101024] p-5 rounded-3xl border border-emerald-500/50 space-y-4 shadow-xl animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-3">
                        <span className="p-2.5 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                          <Car className="w-6 h-6" />
                        </span>
                        <div>
                          <span className="text-xl font-black text-indigo-300 font-mono tracking-wider block">
                            {searchedVehicle.plate}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">
                            Tipo: {searchedVehicle.vehicleType} • Modo: {searchedVehicle.chargingMode}
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        ESTACIONADO
                      </span>
                    </div>

                    {/* Cost & Duration calculations */}
                    {(() => {
                      const feeCalc = calculateParkingFee(
                        searchedVehicle.entryTime,
                        searchedVehicle.chargingMode,
                        rateConfig,
                        searchedVehicle.vehicleType
                      );
                      const storeTotal = searchedVehicle.attachedStoreItems.reduce((acc, c) => acc + c.total, 0);
                      const washFee = searchedVehicle.attachedWashService?.price || searchedWashOrder?.price || 0;
                      const grandTotal = feeCalc.parkingFee + storeTotal + washFee;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-[#080812] p-3 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-slate-400 text-[10px] font-bold block">Ubicación Espacio</span>
                            <span className="text-base font-extrabold text-white font-mono">{searchedVehicle.spotId}</span>
                          </div>

                          <div className="bg-[#080812] p-3 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-slate-400 text-[10px] font-bold block">Hora de Ingreso</span>
                            <span className="text-sm font-bold text-slate-200 font-mono">
                              {formatTimeOnly(searchedVehicle.entryTime)} ({formatDuration(feeCalc.elapsedMinutes)})
                            </span>
                          </div>

                          {searchedVehicle.attachedWashService && (
                            <div className="bg-[#080812] p-3 rounded-2xl border border-indigo-500/30 sm:col-span-2 space-y-1">
                              <span className="text-indigo-400 text-[10px] font-bold block flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> Estado de Lavado Solicitado
                              </span>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">{searchedVehicle.attachedWashService.name}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                                  {searchedVehicle.attachedWashService.status || 'En Espera'}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-2xl sm:col-span-2 flex justify-between items-center text-emerald-300 font-bold">
                            <span>Monto Estimado Actual:</span>
                            <span className="text-lg font-mono font-extrabold text-emerald-400">
                              {formatCurrency(grandTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-[#101024] p-6 rounded-3xl border border-slate-800 text-center space-y-2">
                    <Info className="w-8 h-8 text-amber-400 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-200">No hay vehículo estacionado con la patente "{searchPlate}"</h4>
                    <p className="text-xs text-slate-400">Verifique la placa o consulte al personal del estacionamiento.</p>
                  </div>
                )
              )}

            </div>
          )}

          {/* TAB 4: OFFICIAL TARIFFS & SERVICES */}
          {activeTab === 'tariffs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-[#101024] p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Tarifario de Estacionamiento</h3>
                    <p className="text-xs text-slate-400">Valores vigentes por tramo y minuto</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-[#080812] p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">Primer Tramo (hasta 30 min):</span>
                    <span className="font-mono font-extrabold text-indigo-300">{formatCurrency(rateConfig.firstBlockPrice)}</span>
                  </div>

                  <div className="bg-[#080812] p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">Tramo Adicional (cada 10 min):</span>
                    <span className="font-mono font-extrabold text-indigo-300">{formatCurrency(rateConfig.subsequentBlockPrice)}</span>
                  </div>

                  <div className="bg-[#080812] p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">Cobro por Minuto Directo:</span>
                    <span className="font-mono font-extrabold text-emerald-400">{formatCurrency(rateConfig.minuteRate)} / min</span>
                  </div>

                  <div className="bg-[#080812] p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">Tarifa Noche / Pernoctar:</span>
                    <span className="font-mono font-extrabold text-amber-400">{formatCurrency(rateConfig.nightRate || 12000)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#101024] p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Catálogo de Lavado de Autos</h3>
                    <p className="text-xs text-slate-400">Servicios de limpieza profesional disponibles</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {washServices.map((ws) => (
                    <div key={ws.id} className="bg-[#080812] p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-200 block">{ws.name}</span>
                        <span className="text-[10px] text-slate-400">{ws.estimatedMinutes} min aprox. • {ws.description}</span>
                      </div>
                      <span className="font-mono font-extrabold text-indigo-300">{formatCurrency(ws.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#0a0a14] p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sistema público en vivo • Actualizado automáticamente</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
          >
            Cerrar Vista Pública
          </button>
        </div>

      </div>
    </div>
  );
};
