import React, { useState, useEffect } from 'react';
import { ActiveVehicle, RateConfig } from '../types';
import { calculateParkingFee, formatCurrency, formatDuration } from '../utils/pricing';
import { X, Clock, Calendar, AlertTriangle, Check } from 'lucide-react';

interface VehicleEditTimeModalProps {
  vehicle: ActiveVehicle | null;
  config: RateConfig;
  onClose: () => void;
  onSaveEntryTime: (vehicleId: string, newEntryTimeIso: string) => void;
}

export const VehicleEditTimeModal: React.FC<VehicleEditTimeModalProps> = ({
  vehicle,
  config,
  onClose,
  onSaveEntryTime,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    if (vehicle) {
      const d = new Date(vehicle.entryTime);
      const dateStr = d.toISOString().split('T')[0];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setSelectedDate(dateStr);
      setSelectedTime(`${hours}:${minutes}`);
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const getConstructedIso = (): string => {
    if (!selectedDate || !selectedTime) return vehicle.entryTime;
    const [h, m] = selectedTime.split(':').map(Number);
    const d = new Date(selectedDate);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  };

  const currentIso = getConstructedIso();
  const feeResult = calculateParkingFee(currentIso, vehicle.chargingMode, config, vehicle.vehicleType);

  const handleQuickAdjust = (minutesToAdd: number) => {
    const cur = new Date(currentIso);
    cur.setMinutes(cur.getMinutes() + minutesToAdd);
    const dateStr = cur.toISOString().split('T')[0];
    const hours = String(cur.getHours()).padStart(2, '0');
    const minutes = String(cur.getMinutes()).padStart(2, '0');
    setSelectedDate(dateStr);
    setSelectedTime(`${hours}:${minutes}`);
  };

  const handleSetNow = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedDate(dateStr);
    setSelectedTime(`${hours}:${minutes}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEntryTime(vehicle.id, currentIso);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d0d1a] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
        
        {/* Header */}
        <div className="bg-[#050508] border-b border-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Modificar Hora de Ingreso</h2>
              <p className="text-xs text-slate-400">Patente: <strong className="text-indigo-400 font-mono">{vehicle.plate}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          
          <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Al modificar la hora de ingreso se recalculará automáticamente la tarifa acumulada.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[10px]">
                Fecha de Ingreso
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-slate-200 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[10px]">
                Hora de Ingreso (HH:MM)
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-slate-200 outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Quick Adjustment Shortcuts */}
          <div>
            <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider text-[10px]">
              Ajuste Rápido de Hora
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickAdjust(-60)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 text-[11px]"
              >
                -1 hora
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(-15)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 text-[11px]"
              >
                -15 min
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(15)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 text-[11px]"
              >
                +15 min
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(60)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 text-[11px]"
              >
                +1 hora
              </button>
              <button
                type="button"
                onClick={handleSetNow}
                className="py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold rounded-lg border border-indigo-500/40 text-[11px]"
              >
                Ahora
              </button>
            </div>
          </div>

          {/* Recalculated preview card */}
          <div className="bg-[#111122] rounded-xl p-4 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
              Simulación de Tarifa Actualizada:
            </span>
            <div className="flex justify-between text-slate-400">
              <span>Tiempo Transcurrido:</span>
              <span className="font-bold font-mono text-slate-200">{formatDuration(feeResult.elapsedMinutes)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Modalidad de Cobro:</span>
              <span className="font-bold capitalize text-slate-200">{vehicle.chargingMode === 'tramo' ? 'Por Tramo' : 'Por Minuto'}</span>
            </div>
            <div className="flex justify-between text-emerald-400 text-sm font-extrabold pt-2 border-t border-slate-800">
              <span>Nuevo Cobro Estacionamiento:</span>
              <span className="font-mono">{formatCurrency(feeResult.parkingFee)}</span>
            </div>
          </div>

          {/* Form buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-950/50"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Nueva Hora</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
