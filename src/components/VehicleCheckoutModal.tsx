import React, { useState } from 'react';
import { ActiveVehicle, RateConfig, StoreItem } from '../types';
import { calculateParkingFee, formatCurrency, formatDuration, formatTimeOnly } from '../utils/pricing';
import { Check, Clock, CreditCard, DollarSign, LogOut, Plus, Printer, ShieldAlert, ShoppingCart, Sparkles, Trash2, X } from 'lucide-react';

interface VehicleCheckoutModalProps {
  vehicle: ActiveVehicle | null;
  config: RateConfig;
  storeCatalog: StoreItem[];
  onClose: () => void;
  onConfirmCheckout: (transactionData: {
    vehicle: ActiveVehicle;
    parkingFee: number;
    storeFee: number;
    washFee: number;
    surchargeFee?: number;
    surchargeReason?: string;
    discount: number;
    total: number;
    amountPaid?: number;
    changeGiven?: number;
    vatAmount?: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
    paymentReference?: string;
    elapsedMinutes: number;
    itemDetails: string[];
  }) => void;
  onUpdateVehicleStoreItems: (vehicleId: string, storeItems: { item: StoreItem; quantity: number; total: number }[]) => void;
  onDeleteVehicle?: (vehicle: ActiveVehicle) => void;
}

export const VehicleCheckoutModal: React.FC<VehicleCheckoutModalProps> = ({
  vehicle,
  config,
  storeCatalog,
  onClose,
  onConfirmCheckout,
  onUpdateVehicleStoreItems,
  onDeleteVehicle,
}) => {
  if (!vehicle) return null;

  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [selectedAddProductId, setSelectedAddProductId] = useState<string>('');
  
  // Cobro Extra por Vehículo Mal Estacionado u Otros Conceptos
  const [surchargeFee, setSurchargeFee] = useState<number>(0);
  const [surchargeReason, setSurchargeReason] = useState<string>('vehiculo_mal_estacionado');
  const [surchargeCustomDetail, setSurchargeCustomDetail] = useState<string>('');

  const nowIso = new Date().toISOString();
  const feeResult = calculateParkingFee(vehicle.entryTime, vehicle.chargingMode, config, vehicle.vehicleType, nowIso);

  const storeFee = vehicle.attachedStoreItems.reduce((sum, i) => sum + i.total, 0);
  const washFee = vehicle.attachedWashService?.price || 0;
  const subtotal = feeResult.parkingFee + storeFee + washFee + surchargeFee;
  const total = Math.max(0, subtotal - discount);

  const cashNum = parseFloat(cashGiven) || 0;
  const change = Math.max(0, cashNum - total);

  // Add store item on the fly
  const handleAddStoreItem = () => {
    if (!selectedAddProductId) return;
    const prod = storeCatalog.find((p) => p.id === selectedAddProductId);
    if (!prod) return;

    const existingIndex = vehicle.attachedStoreItems.findIndex((i) => i.item.id === prod.id);
    let updated = [...vehicle.attachedStoreItems];

    if (existingIndex >= 0) {
      const current = updated[existingIndex];
      updated[existingIndex] = {
        ...current,
        quantity: current.quantity + 1,
        total: (current.quantity + 1) * prod.price,
      };
    } else {
      updated.push({ item: prod, quantity: 1, total: prod.price });
    }

    onUpdateVehicleStoreItems(vehicle.id, updated);
    setSelectedAddProductId('');
  };

  const handleRemoveStoreItem = (index: number) => {
    const updated = vehicle.attachedStoreItems.filter((_, i) => i !== index);
    onUpdateVehicleStoreItems(vehicle.id, updated);
  };

  const handleConfirm = () => {
    const itemDetails: string[] = [
      feeResult.breakdownText,
    ];

    vehicle.attachedStoreItems.forEach((si) => {
      itemDetails.push(`${si.quantity}x ${si.item.name} valor ${formatCurrency(si.total)}`);
    });

    if (vehicle.attachedWashService) {
      itemDetails.push(`Lavado ${vehicle.attachedWashService.serviceName} valor ${formatCurrency(washFee)}`);
    }

    if (surchargeFee > 0) {
      const reasonLabel =
        surchargeReason === 'vehiculo_mal_estacionado'
          ? 'Multa/Recargo por Vehículo Mal Estacionado'
          : surchargeReason === 'bloqueo_paso'
          ? 'Recargo por Bloqueo de Vía de Circulación'
          : surchargeReason === 'ticket_extraviado'
          ? 'Cobro por Pérdida/Extravío de Ticket'
          : surchargeCustomDetail || 'Recargo / Concepto Especial';
      itemDetails.push(`Cobro Extra (${reasonLabel}): ${formatCurrency(surchargeFee)}`);
    }

    if (discount > 0) {
      itemDetails.push(`Descuento Aplicado: -${formatCurrency(discount)}`);
    }

    if ((paymentMethod === 'tarjeta' || paymentMethod === 'transferencia') && !paymentReference.trim()) {
      alert(`Por favor ingrese el Código de Confirmación / Voucher / N° Operación para la conciliación de pagos con ${paymentMethod === 'tarjeta' ? 'tarjeta de débito/crédito' : 'transferencia bancaria'}.`);
      return;
    }

    const cashNum = parseFloat(cashGiven) || 0;
    const amountPaidVal = paymentMethod === 'efectivo' ? (cashNum > 0 ? cashNum : total) : total;
    const changeVal = paymentMethod === 'efectivo' ? Math.max(0, cashNum - total) : 0;
    const vatVal = Math.round(total - (total / 1.19));

    onConfirmCheckout({
      vehicle,
      parkingFee: feeResult.parkingFee,
      storeFee,
      washFee,
      surchargeFee: surchargeFee > 0 ? surchargeFee : undefined,
      surchargeReason: surchargeFee > 0 ? (surchargeCustomDetail || surchargeReason) : undefined,
      discount,
      total,
      amountPaid: amountPaidVal,
      changeGiven: changeVal,
      vatAmount: vatVal,
      paymentMethod,
      paymentReference: paymentReference.trim() || undefined,
      elapsedMinutes: feeResult.elapsedMinutes,
      itemDetails,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d0d1a] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
        
        {/* Header */}
        <div className="bg-[#050508] border-b border-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Cobro y Salida de Vehículo</h2>
              <p className="text-xs text-slate-400">Cierre de ticket para la patente <strong className="font-mono text-emerald-400 underline">{vehicle.plate}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111122] p-4 rounded-2xl border border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Espacio</span>
              <span className="text-base font-extrabold text-slate-100">{vehicle.spotId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Hora Entrada</span>
              <span className="text-sm font-bold font-mono text-slate-300">{formatTimeOnly(vehicle.entryTime)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tiempo Permanencia</span>
              <span className="text-sm font-bold font-mono text-indigo-400">{formatDuration(feeResult.elapsedMinutes)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Modalidad</span>
              <span className="text-xs font-bold text-purple-400 capitalize">{vehicle.chargingMode === 'tramo' ? 'Por Tramo' : 'Por Minuto'}</span>
            </div>
          </div>

          {/* Detailed Fees Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle del Cobro</h3>

            {/* Parking Fee Row */}
            <div className="bg-[#111122] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">Estacionamiento ({formatDuration(feeResult.elapsedMinutes)})</div>
                <div className="text-[11px] text-slate-400">{feeResult.breakdownText}</div>
              </div>
              <div className="text-sm font-mono font-extrabold text-slate-100">{formatCurrency(feeResult.parkingFee)}</div>
            </div>

            {/* Store Items Attached */}
            <div className="bg-[#111122] p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                  Artículos de Tienda Adquiridos
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">{formatCurrency(storeFee)}</span>
              </div>

              {vehicle.attachedStoreItems.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic">No hay productos adjuntos.</div>
              ) : (
                <div className="space-y-1">
                  {vehicle.attachedStoreItems.map((si, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-[#0d0d1a] p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-300">{si.quantity}x {si.item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-slate-200">{formatCurrency(si.total)}</span>
                        <button
                          onClick={() => handleRemoveStoreItem(idx)}
                          className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Store item directly on checkout */}
              <div className="pt-2 flex items-center gap-2">
                <select
                  value={selectedAddProductId}
                  onChange={(e) => setSelectedAddProductId(e.target.value)}
                  className="bg-[#0d0d1a] border border-slate-800 rounded-lg text-xs py-1.5 px-2 flex-1 text-slate-200 outline-hidden focus:border-amber-500"
                >
                  <option value="" className="bg-[#0d0d1a] text-slate-200">-- Agregar producto de tienda --</option>
                  {storeCatalog.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0d0d1a] text-slate-200">
                      {p.name} - {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddStoreItem}
                  disabled={!selectedAddProductId}
                  className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-500 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Car Wash Fee Attached */}
            {vehicle.attachedWashService && (
              <div className="bg-purple-950/40 p-3.5 rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Servicio de Lavado: {vehicle.attachedWashService.serviceName}
                  </div>
                  <div className="text-[11px] text-purple-400">Estado: <strong className="uppercase">{vehicle.attachedWashService.status}</strong></div>
                </div>
                <div className="text-sm font-mono font-extrabold text-purple-300">{formatCurrency(washFee)}</div>
              </div>
            )}

            {/* CUADRO DE COBRO POR VEHÍCULO MAL ESTACIONADO U OTROS CONCEPTOS */}
            <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Cobro por Vehículo Mal Estacionado / Conceptos Extra
                </span>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {surchargeFee > 0 ? `+${formatCurrency(surchargeFee)}` : 'Sin recargo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Concepto o Infracción</label>
                  <select
                    value={surchargeReason}
                    onChange={(e) => setSurchargeReason(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-rose-900/60 rounded-xl text-xs py-1.5 px-2.5 text-slate-200 outline-hidden focus:border-rose-500"
                  >
                    <option value="vehiculo_mal_estacionado">⚠️ Vehículo Mal Estacionado / Ocupa 2 Pasos</option>
                    <option value="bloqueo_paso">🛑 Bloqueo de Vía de Circulación</option>
                    <option value="ticket_extraviado">🎫 Pérdida de Ticket / Duplicado</option>
                    <option value="otro">✏️ Otro Concepto Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Monto Recargo ($ CLP)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={surchargeFee || ''}
                    onChange={(e) => setSurchargeFee(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Ej: 5000"
                    className="w-full bg-[#0d0d1a] border border-rose-900/60 rounded-xl text-xs py-1.5 px-2.5 font-mono font-bold text-rose-300 outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Botones de atajo rápido para montos de recargo */}
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-slate-400 text-[10px] font-semibold">Atajos:</span>
                <button
                  type="button"
                  onClick={() => { setSurchargeFee(3000); setSurchargeReason('vehiculo_mal_estacionado'); }}
                  className="px-2 py-0.5 rounded-lg bg-rose-900/40 text-rose-300 border border-rose-700/40 hover:bg-rose-800/60 cursor-pointer"
                >
                  +$3.000 (Leve)
                </button>
                <button
                  type="button"
                  onClick={() => { setSurchargeFee(5000); setSurchargeReason('vehiculo_mal_estacionado'); }}
                  className="px-2 py-0.5 rounded-lg bg-rose-900/40 text-rose-300 border border-rose-700/40 hover:bg-rose-800/60 cursor-pointer"
                >
                  +$5.000 (Grave)
                </button>
                <button
                  type="button"
                  onClick={() => { setSurchargeFee(10000); setSurchargeReason('bloqueo_paso'); }}
                  className="px-2 py-0.5 rounded-lg bg-rose-900/40 text-rose-300 border border-rose-700/40 hover:bg-rose-800/60 cursor-pointer"
                >
                  +$10.000 (Bloqueo)
                </button>
                {surchargeFee > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSurchargeFee(0); setSurchargeCustomDetail(''); }}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Quitar recargo
                  </button>
                )}
              </div>

              {surchargeReason === 'otro' && (
                <div>
                  <input
                    type="text"
                    value={surchargeCustomDetail}
                    onChange={(e) => setSurchargeCustomDetail(e.target.value)}
                    placeholder="Escriba el detalle del concepto especial..."
                    className="w-full bg-[#0d0d1a] border border-rose-900/60 rounded-xl text-xs py-1.5 px-2.5 text-slate-200 outline-hidden focus:border-rose-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Total & Discounts */}
          <div className="bg-[#050508] text-white p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Subtotal Servicios</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Descuento Especial ($)</span>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-28 bg-[#111122] border border-slate-800 rounded-lg text-right py-1 px-2 text-xs font-mono font-bold text-emerald-400 outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between text-lg font-extrabold pt-2 border-t border-slate-800 text-emerald-400">
              <span>TOTAL A PAGAR</span>
              <span className="text-2xl font-mono font-black text-emerald-400">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Method & Change */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Método de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  paymentMethod === 'efectivo'
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 font-bold shadow-md'
                    : 'border-slate-800 bg-[#111122] text-slate-400 hover:border-slate-700'
                }`}
              >
                <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                <span className="text-xs">Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  paymentMethod === 'tarjeta'
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 font-bold shadow-md'
                    : 'border-slate-800 bg-[#111122] text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                <span className="text-xs">Tarjeta (Déb/Créd)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  paymentMethod === 'transferencia'
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 font-bold shadow-md'
                    : 'border-slate-800 bg-[#111122] text-slate-400 hover:border-slate-700'
                }`}
              >
                <Check className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <span className="text-xs">Transferencia</span>
              </button>
            </div>

            {paymentMethod === 'efectivo' && (
              <div className="bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/30 grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">Monto Entregado ($)</label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Ej: 20000"
                    className="w-full bg-[#111122] border border-emerald-500/40 rounded-xl py-2 px-3 text-sm font-mono font-bold text-emerald-300 outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold text-emerald-300 mb-1">Vuelto / Cambio</span>
                  <div className="text-xl font-mono font-black text-emerald-400 bg-[#111122] border border-emerald-500/30 py-1.5 px-3 rounded-xl text-right">
                    {cashGiven ? formatCurrency(change) : '$0'}
                  </div>
                </div>
              </div>
            )}

            {(paymentMethod === 'tarjeta' || paymentMethod === 'transferencia') && (
              <div className="bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-500/40 space-y-2">
                <label className="block text-xs font-bold text-indigo-300">
                  Código de Confirmación / Voucher / N° Transacción (Conciliación) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={
                    paymentMethod === 'tarjeta'
                      ? 'Ej: Voucher Transbank N° 849201 ó Código Autorización'
                      : 'Ej: N° Transferencia Banco 930192'
                  }
                  className="w-full bg-[#111122] border border-indigo-500/60 rounded-xl py-2 px-3 text-xs font-mono font-bold text-indigo-200 outline-hidden focus:border-indigo-400 uppercase"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  ⚠️ Campo requerido para la conciliación de datos y cuadratura de caja.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            {onDeleteVehicle && (
              <button
                type="button"
                onClick={() => {
                  onDeleteVehicle(vehicle);
                  onClose();
                }}
                className="px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Eliminar ingreso sin cobrar (para vehículos que ingresaron y salieron sin estacionar)"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Dar de Baja (Sin Cobro)</span>
              </button>
            )}

            <div className="flex items-center space-x-3 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Procesar Cobro e Imprimir Ticket</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
