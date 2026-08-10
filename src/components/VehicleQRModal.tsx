import React, { useState } from 'react';
import { ActiveVehicle, ParkingSpot, RateConfig } from '../types';
import { calculateParkingFee, formatCurrency, formatDuration, formatTimeOnly } from '../utils/pricing';
import { X, QrCode, Copy, Check, ExternalLink, Printer, ShieldCheck, Clock, Car, Sparkles } from 'lucide-react';

interface VehicleQRModalProps {
  vehicle: ActiveVehicle | null;
  config: RateConfig;
  onClose: () => void;
  onOpenLiveTrackerPlate?: (plate: string) => void;
}

export const VehicleQRModal: React.FC<VehicleQRModalProps> = ({ vehicle, config, onClose, onOpenLiveTrackerPlate }) => {
  const [copied, setCopied] = useState(false);
  const [simulatedScanView, setSimulatedScanView] = useState(false);

  if (!vehicle) return null;

  const feeResult = calculateParkingFee(vehicle.entryTime, vehicle.chargingMode, config, vehicle.vehicleType);
  const storeTotal = vehicle.attachedStoreItems.reduce((acc, curr) => acc + curr.total, 0);
  const washTotal = vehicle.attachedWashService?.price || 0;
  const grandTotal = feeResult.parkingFee + storeTotal + washTotal;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?track_plate=${vehicle.plate}`
    : `https://autopark.app/?track_plate=${vehicle.plate}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d0d1a] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
        
        {/* Header */}
        <div className="bg-[#050508] border-b border-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Código QR del Vehículo</h2>
              <p className="text-xs text-slate-400">Estado en tiempo real para el cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* QR Code Container */}
          <div className="bg-[#050508] p-6 rounded-2xl border border-slate-800 text-center space-y-4 flex flex-col items-center">
            
            <div 
              onClick={() => onOpenLiveTrackerPlate && onOpenLiveTrackerPlate(vehicle.plate)}
              className="bg-white p-3 rounded-2xl shadow-xl inline-block border-4 border-indigo-500/30 cursor-pointer hover:scale-105 transition-transform group relative"
              title="Haga clic para abrir el Monitoreo en Tiempo Real"
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(trackingUrl)}`}
                alt={`QR Tracking ${vehicle.plate}`}
                className="w-44 h-44 object-contain"
              />
              <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md">
                  🔍 Abrir Monitoreo
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xl font-black text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-500/40 inline-block">
                {vehicle.plate}
              </span>
              <p className="text-xs text-slate-400">
                El cliente escanea este código para ver en <strong className="text-emerald-400">tiempo real</strong> su tiempo, cobro y avance de lavado.
              </p>
            </div>

            {/* Live Status summary */}
            <div className="w-full bg-[#111122] rounded-xl p-3 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-indigo-400" /> Espacio:
                </span>
                <span className="font-bold text-slate-100">{vehicle.spotId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Ingreso:
                </span>
                <span className="font-mono text-slate-200">{formatTimeOnly(vehicle.entryTime)} ({formatDuration(feeResult.elapsedMinutes)})</span>
              </div>
              {vehicle.attachedWashService && (
                <div className="flex justify-between items-center text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Lavado:
                  </span>
                  <span className="font-bold capitalize bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                    {vehicle.attachedWashService.status}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-emerald-400 pt-1 border-t border-slate-800 font-bold">
                <span>Total Estimado:</span>
                <span className="font-mono text-sm">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="space-y-2 text-xs">
            {onOpenLiveTrackerPlate && (
              <button
                type="button"
                onClick={() => onOpenLiveTrackerPlate(vehicle.plate)}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <ExternalLink className="w-4 h-4 text-white" />
                <span>Probar Escaneo / Abrir Pantalla del Cliente</span>
              </button>
            )}

            <button
              onClick={() => setSimulatedScanView(!simulatedScanView)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>{simulatedScanView ? 'Ocultar Enlace Escaneado' : 'Ver URL Directa del QR'}</span>
            </button>

            {simulatedScanView && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vista Previa: Portal de Seguimiento Cliente</span>
                </div>
                <p className="text-slate-300">
                  El cliente verá: <strong className="text-white">Vehículo {vehicle.plate}</strong> en espacio <strong className="text-white">{vehicle.spotId}</strong> con ingreso a las {formatTimeOnly(vehicle.entryTime)}.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-black/40 p-2 rounded border border-slate-800 break-all">
                  {trackingUrl}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold cursor-pointer flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={handlePrintQR}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir QR</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
