import React, { useState, useEffect } from 'react';
import { Booking, CarWashService, ChargingMode, ParkingSpot, RateConfig, Transaction, VehicleClientRecord, VehicleType } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Car, Check, Info, Sparkles, X, User, Phone, Database, Star, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';

interface VehicleEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSpots: ParkingSpot[];
  preselectedSpotId?: string;
  config: RateConfig;
  washServices: CarWashService[];
  clientRecords?: VehicleClientRecord[];
  transactions?: Transaction[];
  bookings?: Booking[];
  onSubmitEntry: (vehicleData: {
    plate: string;
    vehicleType: VehicleType;
    make?: string;
    model?: string;
    color?: string;
    spotId: string;
    chargingMode: ChargingMode;
    driverName?: string;
    driverPhone?: string;
    washServiceId?: string;
  }) => void;
}

const vehicleTypes: { id: VehicleType; label: string; icon: string; multiplier: number }[] = [
  { id: 'auto', label: 'Auto / Sedán', icon: '🚗', multiplier: 1.0 },
  { id: 'suv', label: 'SUV / Crossover', icon: '🚙', multiplier: 1.2 },
  { id: 'camioneta', label: 'Camioneta Pick-up', icon: '🛻', multiplier: 1.25 },
  { id: 'moto', label: 'Motocicleta', icon: '🏍️', multiplier: 0.7 },
  { id: 'furgon', label: 'Furgón / Van', icon: '🚐', multiplier: 1.4 },
];

export const VehicleEntryModal: React.FC<VehicleEntryModalProps> = ({
  isOpen,
  onClose,
  availableSpots,
  preselectedSpotId,
  config,
  washServices,
  clientRecords = [],
  transactions = [],
  bookings = [],
  onSubmitEntry,
}) => {
  if (!isOpen) return null;

  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('auto');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [spotId, setSpotId] = useState(preselectedSpotId || availableSpots[0]?.id || '');
  const [chargingMode, setChargingMode] = useState<ChargingMode>(config.mode);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [selectedWashId, setSelectedWashId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Autocomplete & Database Match State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchedRecord, setMatchedRecord] = useState<{
    source: 'clientRecord' | 'booking' | 'transaction';
    plate: string;
    vehicleType: VehicleType;
    driverName?: string;
    driverPhone?: string;
    category?: 'normal' | 'vip' | 'mala_resena';
    make?: string;
    model?: string;
    color?: string;
    internalNotes?: string;
  } | null>(null);

  // Search logic for matching plate
  const findDatabaseMatch = (searchPlate: string) => {
    const cleanSearch = searchPlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanSearch) return null;

    // 1. Search in clientRecords
    if (clientRecords.length > 0) {
      const found = clientRecords.find(
        (cr) => cr.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanSearch
      );
      if (found) {
        return {
          source: 'clientRecord' as const,
          plate: found.plate,
          vehicleType: found.vehicleType,
          driverName: found.clientName,
          driverPhone: found.clientPhone,
          category: found.category,
          make: found.make,
          model: found.model,
          color: found.color,
          internalNotes: found.internalNotes,
        };
      }
    }

    // 2. Search in bookings
    if (bookings.length > 0) {
      const found = bookings.find(
        (b) => b.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanSearch
      );
      if (found) {
        return {
          source: 'booking' as const,
          plate: found.plate,
          vehicleType: found.vehicleType,
          driverName: found.clientName,
          driverPhone: found.clientPhone,
          category: 'normal' as const,
        };
      }
    }

    // 3. Search in transactions
    if (transactions.length > 0) {
      const found = transactions.find(
        (tx) =>
          tx.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanSearch &&
          (tx.driverName || tx.driverPhone)
      );
      if (found) {
        return {
          source: 'transaction' as const,
          plate: found.plate,
          vehicleType: found.vehicleType,
          driverName: found.driverName,
          driverPhone: found.driverPhone,
          category: 'normal' as const,
        };
      }
    }

    return null;
  };

  // Get matching suggestions as user types
  const getSuggestions = () => {
    const cleanSearch = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanSearch.length < 2) return [];

    const results: Array<{
      plate: string;
      driverName?: string;
      driverPhone?: string;
      vehicleType: VehicleType;
      category?: 'normal' | 'vip' | 'mala_resena';
      details?: string;
      sourceLabel: string;
    }> = [];

    const addedPlates = new Set<string>();

    clientRecords.forEach((cr) => {
      const clean = cr.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (clean.includes(cleanSearch) && !addedPlates.has(clean)) {
        addedPlates.add(clean);
        results.push({
          plate: cr.plate,
          driverName: cr.clientName,
          driverPhone: cr.clientPhone,
          vehicleType: cr.vehicleType,
          category: cr.category,
          details: [cr.make, cr.model, cr.color].filter(Boolean).join(' '),
          sourceLabel: 'Base de Clientes CRM',
        });
      }
    });

    bookings.forEach((b) => {
      const clean = b.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (clean.includes(cleanSearch) && !addedPlates.has(clean)) {
        addedPlates.add(clean);
        results.push({
          plate: b.plate,
          driverName: b.clientName,
          driverPhone: b.clientPhone,
          vehicleType: b.vehicleType,
          category: 'normal',
          sourceLabel: 'Reserva Programada',
        });
      }
    });

    transactions.forEach((tx) => {
      const clean = tx.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (clean.includes(cleanSearch) && !addedPlates.has(clean)) {
        addedPlates.add(clean);
        results.push({
          plate: tx.plate,
          driverName: tx.driverName,
          driverPhone: tx.driverPhone,
          vehicleType: tx.vehicleType,
          category: 'normal',
          sourceLabel: 'Historial Visitas',
        });
      }
    });

    return results.slice(0, 5);
  };

  const applyDatabaseMatch = (match: ReturnType<typeof findDatabaseMatch>) => {
    if (!match) return;
    setPlate(match.plate);
    setVehicleType(match.vehicleType);
    if (match.driverName) setDriverName(match.driverName);
    if (match.driverPhone) setDriverPhone(match.driverPhone);
    if (match.make) setMake(match.make);
    if (match.model) setModel(match.model);
    if (match.color) setColor(match.color);
    setMatchedRecord(match);
    setShowSuggestions(false);
  };

  const handlePlateChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setPlate(uppercaseVal);
    setShowSuggestions(true);

    // Check for exact match
    const match = findDatabaseMatch(uppercaseVal);
    if (match) {
      setVehicleType(match.vehicleType);
      if (match.driverName) setDriverName(match.driverName);
      if (match.driverPhone) setDriverPhone(match.driverPhone);
      if (match.make) setMake(match.make);
      if (match.model) setModel(match.model);
      if (match.color) setColor(match.color);
      setMatchedRecord(match);
    } else {
      setMatchedRecord(null);
    }
  };

  const suggestions = getSuggestions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || plate.trim().length < 4) {
      setErrorMsg('Ingrese una patente válida (mínimo 4 caracteres).');
      return;
    }
    if (!spotId) {
      setErrorMsg('Seleccione un espacio de estacionamiento disponible.');
      return;
    }

    onSubmitEntry({
      plate: plate.trim().toUpperCase(),
      vehicleType,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      color: color.trim() || undefined,
      spotId,
      chargingMode,
      driverName: driverName.trim() || undefined,
      driverPhone: driverPhone.trim() || undefined,
      washServiceId: selectedWashId || undefined,
    });

    // Reset & close
    setPlate('');
    setMake('');
    setModel('');
    setColor('');
    setDriverName('');
    setDriverPhone('');
    setSelectedWashId('');
    setErrorMsg('');
    setMatchedRecord(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d0d1a] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
        
        {/* Header */}
        <div className="bg-[#050508] border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Registrar Ingreso de Vehículo</h2>
              <p className="text-xs text-slate-400">Emisión de ticket y asignación de espacio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-950/80 text-red-400 text-xs p-3 rounded-xl border border-red-500/30 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Patente & Vehicle Type with DB Auto-fill */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Patente / Placa Vehicular *</span>
              {matchedRecord && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  <Database className="w-3 h-3" /> Datos Cargados desde BD
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={plate}
                onChange={(e) => handlePlateChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ej: KDJF-84 o RPTX-92"
                className={`w-full bg-[#111122] border-2 rounded-xl py-3 px-4 text-center text-2xl font-mono font-bold tracking-widest uppercase transition-all outline-hidden ${
                  matchedRecord
                    ? 'border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/30'
                    : 'border-slate-800 focus:border-indigo-500 text-indigo-300 placeholder:text-slate-600'
                }`}
                maxLength={10}
                required
                autoFocus
              />
              {matchedRecord && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Suggestions Popup */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#111122] border border-indigo-500/50 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                <div className="bg-indigo-950/80 px-3 py-1.5 text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                  <Database className="w-3 h-3 text-indigo-400" /> Vehículos Registrados en Base de Datos:
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      const match = findDatabaseMatch(item.plate);
                      applyDatabaseMatch(match);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-indigo-900/40 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-indigo-300 text-sm">{item.plate}</span>
                        {item.category === 'vip' && (
                          <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5 border border-amber-500/30">
                            <Star className="w-2.5 h-2.5 fill-amber-400" /> VIP
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-md font-medium">
                          {item.sourceLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        {item.driverName || 'Sin Nombre'} {item.driverPhone ? `• ${item.driverPhone}` : ''}
                      </div>
                      {item.details && (
                        <div className="text-[10px] text-slate-400">{item.details}</div>
                      )}
                    </div>
                    <span className="text-xs text-indigo-400 font-bold">Seleccionar ↵</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Database Match Info Banner */}
          {matchedRecord && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Vehículo Registrado Encontrado en Base de Datos</span>
                </div>
                {matchedRecord.category === 'vip' && (
                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Cliente VIP
                  </span>
                )}
                {matchedRecord.category === 'mala_resena' && (
                  <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> Atención
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-[#0a0a14] p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">Conductor / Cliente:</span>
                  <span className="font-bold text-slate-200">{matchedRecord.driverName || 'No especificado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Teléfono Contacto:</span>
                  <span className="font-bold text-slate-200 font-mono">{matchedRecord.driverPhone || 'Sin teléfono'}</span>
                </div>
                {(matchedRecord.make || matchedRecord.model) && (
                  <div className="col-span-2 pt-1 border-t border-slate-800 text-[11px] text-indigo-300">
                    🚘 <strong>Vehículo:</strong> {matchedRecord.make} {matchedRecord.model} ({matchedRecord.color})
                  </div>
                )}
                {matchedRecord.internalNotes && (
                  <div className="col-span-2 pt-1 border-t border-slate-800 text-[10px] text-amber-300 italic">
                    📌 <strong>Nota Interna:</strong> {matchedRecord.internalNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tipo de Vehículo
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {vehicleTypes.map((vt) => (
                <button
                  type="button"
                  key={vt.id}
                  onClick={() => setVehicleType(vt.id)}
                  className={`p-2 rounded-xl text-center border-2 transition-all cursor-pointer ${
                    vehicleType === vt.id
                      ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold shadow-md shadow-indigo-950/40'
                      : 'border-slate-800 bg-[#111122] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xl mb-0.5">{vt.icon}</div>
                  <div className="text-[11px] font-semibold truncate text-slate-200">{vt.label.split('/')[0]}</div>
                  <div className="text-[9px] text-slate-500 font-mono">x{vt.multiplier}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Spot Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Espacio Asignado *
            </label>
            {availableSpots.length === 0 ? (
              <div className="text-xs text-red-400 font-bold bg-red-950/80 p-3 rounded-xl border border-red-500/30">
                ⚠️ No hay espacios disponibles en el estacionamiento.
              </div>
            ) : (
              <select
                value={spotId}
                onChange={(e) => setSpotId(e.target.value)}
                className="w-full bg-[#111122] border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-200 outline-hidden"
              >
                {availableSpots.map((spot) => (
                  <option key={spot.id} value={spot.id} className="bg-[#0d0d1a] text-slate-200">
                    Espacio {spot.id} — ({spot.zone})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Charging Mode Picker */}
          <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Modalidad de Cobro</span>
              <span className="text-[11px] text-indigo-400 font-normal">Configuración Activa</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setChargingMode('tramo')}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  chargingMode === 'tramo'
                    ? 'border-indigo-500 bg-indigo-950/80 text-indigo-200 font-bold shadow-md'
                    : 'border-slate-800 bg-[#0d0d1a] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold mb-1">
                  <span className="text-slate-200">⏱️ Por Tramo</span>
                  {chargingMode === 'tramo' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="text-[10px] leading-tight text-slate-400 font-normal">
                  1º Tramo: <strong>{config.firstBlockMinutes}m</strong> ({formatCurrency(config.firstBlockPrice)})
                  <br />
                  Sig: <strong>10m</strong> ({formatCurrency(config.subsequentBlockPrice)})
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChargingMode('minuto')}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  chargingMode === 'minuto'
                    ? 'border-indigo-500 bg-indigo-950/80 text-indigo-200 font-bold shadow-md'
                    : 'border-slate-800 bg-[#0d0d1a] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold mb-1">
                  <span className="text-slate-200">⚡ Por Minuto</span>
                  {chargingMode === 'minuto' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="text-[10px] leading-tight text-slate-400 font-normal">
                  Tarifa: <strong>{formatCurrency(config.minuteRate)}/min</strong>
                  <br />
                  Cobro exacto
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChargingMode('nocturno')}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  chargingMode === 'nocturno'
                    ? 'border-purple-500 bg-purple-950/90 text-purple-200 font-bold shadow-md'
                    : 'border-purple-900/40 bg-purple-950/20 text-purple-300 hover:border-purple-700'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold mb-1">
                  <span className="text-purple-300">🌙 Nocturno</span>
                  {chargingMode === 'nocturno' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <div className="text-[10px] leading-tight text-purple-300/80 font-normal">
                  Tarifa Pernocte: <strong>{formatCurrency(config.nightlyRate)}/noche</strong>
                  <br />
                  Estadía noche completa
                </div>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-[#0d0d1a] p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Requisito normativo: El primer tramo es de mínimo {config.firstBlockMinutes} minutos. Tolerancia grátis de {config.gracePeriodMinutes} min.
              </span>
            </div>
          </div>

          {/* Optional Car Wash Add-on */}
          <div className="border border-indigo-500/30 bg-indigo-950/30 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                ¿Agregar Servicio de Lavado?
              </span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                Opcional
              </span>
            </div>
            <select
              value={selectedWashId}
              onChange={(e) => setSelectedWashId(e.target.value)}
              className="w-full bg-[#111122] border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs font-medium text-slate-200 outline-hidden"
            >
              <option value="" className="bg-[#0d0d1a] text-slate-200">Sin servicio de lavado</option>
              {washServices.map((ws) => (
                <option key={ws.id} value={ws.id} className="bg-[#0d0d1a] text-slate-200">
                  {ws.name} — {formatCurrency(ws.price)} (~{ws.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Details (Marca, Modelo, Color) */}
          <div className="bg-[#111122] p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Datos del Vehículo</span>
              <span className="text-[10px] text-slate-500 font-normal">Para Ticket y CRM</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Marca</label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Ej: Toyota"
                  className="w-full bg-[#0d0d1a] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-2.5 text-xs text-slate-200 outline-hidden placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Modelo</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej: Yaris"
                  className="w-full bg-[#0d0d1a] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-2.5 text-xs text-slate-200 outline-hidden placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Ej: Rojo"
                  className="w-full bg-[#0d0d1a] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-2.5 text-xs text-slate-200 outline-hidden placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Driver Info (Optional) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" /> Nombre Conductor
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-[#111122] border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 outline-hidden focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" /> Teléfono Contacto
              </label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="+569 ..."
                className="w-full bg-[#111122] border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 outline-hidden focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={availableSpots.length === 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/50 transition-all cursor-pointer disabled:opacity-50"
            >
              Ingresar y Generar Ticket
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
