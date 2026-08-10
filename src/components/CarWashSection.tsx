import React, { useState } from 'react';
import { ActiveVehicle, CarWashService, VehicleType, WashOrder, WashStatus } from '../types';
import { formatCurrency, formatTimeOnly } from '../utils/pricing';
import { Check, Clock, Plus, Sparkles, User, Car, X, ShieldCheck, Edit3, Trash2, Settings } from 'lucide-react';

interface CarWashSectionProps {
  services: CarWashService[];
  washOrders: WashOrder[];
  activeVehicles: ActiveVehicle[];
  onAddWashOrder: (order: Omit<WashOrder, 'id' | 'createdAt'>) => void;
  onUpdateWashStatus: (orderId: string, newStatus: WashStatus) => void;
  onAddWashService?: (service: Omit<CarWashService, 'id'>) => void;
  onUpdateWashService?: (service: CarWashService) => void;
  onDeleteWashService?: (serviceId: string) => void;
}

const statusColumns: { id: WashStatus; label: string; bg: string; border: string; text: string }[] = [
  { id: 'pendiente', label: 'Pendiente', bg: 'bg-[#0d0d1a]', border: 'border-amber-500/30', text: 'text-amber-400' },
  { id: 'en_proceso', label: 'En Proceso', bg: 'bg-[#0d0d1a]', border: 'border-indigo-500/40', text: 'text-indigo-400' },
  { id: 'listo', label: 'Listo p/ Entrega', bg: 'bg-[#0d0d1a]', border: 'border-purple-500/40', text: 'text-purple-400' },
  { id: 'entregado', label: 'Entregado', bg: 'bg-[#0d0d1a]', border: 'border-emerald-500/40', text: 'text-emerald-400' },
];

export const CarWashSection: React.FC<CarWashSectionProps> = ({
  services,
  washOrders,
  activeVehicles,
  onAddWashOrder,
  onUpdateWashStatus,
  onAddWashService,
  onUpdateWashService,
  onDeleteWashService,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Service CRUD state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<CarWashService | null>(null);
  const [serviceFormName, setServiceFormName] = useState('');
  const [serviceFormCategory, setServiceFormCategory] = useState<string>('completo');
  const [serviceFormDescription, setServiceFormDescription] = useState('');
  const [serviceFormPrice, setServiceFormPrice] = useState<number>(10000);
  const [serviceFormDuration, setServiceFormDuration] = useState<number>(30);

  // Form state for Wash Order
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('auto');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [operator, setOperator] = useState('Juan Pérez');
  const [linkedSpotId, setLinkedSpotId] = useState('');

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceFormName('');
    setServiceFormCategory('completo');
    setServiceFormDescription('');
    setServiceFormPrice(12000);
    setServiceFormDuration(35);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: CarWashService) => {
    setEditingService(s);
    setServiceFormName(s.name);
    setServiceFormCategory(s.category);
    setServiceFormDescription(s.description);
    setServiceFormPrice(s.price);
    setServiceFormDuration(s.durationMinutes);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormName.trim()) return;

    if (editingService) {
      if (onUpdateWashService) {
        onUpdateWashService({
          ...editingService,
          name: serviceFormName.trim(),
          category: serviceFormCategory as any,
          description: serviceFormDescription.trim(),
          price: serviceFormPrice,
          durationMinutes: serviceFormDuration,
        });
      }
    } else {
      if (onAddWashService) {
        onAddWashService({
          name: serviceFormName.trim(),
          category: serviceFormCategory as any,
          description: serviceFormDescription.trim(),
          price: serviceFormPrice,
          durationMinutes: serviceFormDuration,
        });
      }
    }
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = (s: CarWashService) => {
    if (confirm(`¿Está seguro de eliminar el servicio de lavado "${s.name}"?`)) {
      if (onDeleteWashService) {
        onDeleteWashService(s.id);
      }
    }
  };

  const handleOpenNewOrder = (prefillPlate?: string, prefillType?: VehicleType, prefillSpot?: string) => {
    if (prefillPlate) setPlate(prefillPlate);
    if (prefillType) setVehicleType(prefillType);
    if (prefillSpot) setLinkedSpotId(prefillSpot);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    const selectedService = services.find((s) => s.id === serviceId);
    if (!selectedService) return;

    onAddWashOrder({
      plate: plate.trim().toUpperCase(),
      vehicleType,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      assignedOperator: operator,
      status: 'pendiente',
      spotId: linkedSpotId || undefined,
    });

    setIsModalOpen(false);
    setPlate('');
    setLinkedSpotId('');
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-indigo-950 via-[#0a0a12] to-[#0d0d1a] text-white rounded-3xl p-6 border border-indigo-500/30 shadow-xl shadow-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Estación de Lavado & Detallado</h2>
            <p className="text-xs text-slate-400">Gestión de órdenes de lavado, estatus en tiempo real y asignación de operarios.</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenNewOrder()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50 transition-all cursor-pointer whitespace-nowrap border border-indigo-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden de Lavado</span>
        </button>
      </div>

      {/* Services Catalog Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catálogo de Servicios Disponibles</h3>
          {onAddWashService && (
            <button
              onClick={handleOpenAddService}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Servicio</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {services.map((s) => (
            <div key={s.id} className="bg-[#0d0d1a] p-4 rounded-2xl border border-slate-800/60 shadow-lg shadow-black/20 flex flex-col justify-between hover:border-indigo-500/50 transition-colors relative group">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                    {s.category}
                  </span>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {onUpdateWashService && (
                      <button
                        onClick={() => handleOpenEditService(s)}
                        title="Modificar Servicio"
                        className="p-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    {onDeleteWashService && (
                      <button
                        onClick={() => handleDeleteService(s)}
                        title="Eliminar Servicio"
                        className="p-1 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-100 mt-2">{s.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">{s.description}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-indigo-400" /> ~{s.durationMinutes} min
                </span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">{formatCurrency(s.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board of Active Wash Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tablero de Estatus de Lavado</h3>
          <span className="text-xs text-slate-400 font-mono">Total Órdenes: {washOrders.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((col) => {
            const colOrders = washOrders.filter((o) => o.status === col.id);

            return (
              <div key={col.id} className={`rounded-2xl p-4 border ${col.border} ${col.bg} min-h-[300px] flex flex-col space-y-3 shadow-xl shadow-black/20`}>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className={`font-extrabold text-xs uppercase tracking-wider ${col.text}`}>
                    {col.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 ${col.text}`}>
                    {colOrders.length}
                  </span>
                </div>

                {colOrders.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 font-medium italic">
                    Sin vehículos en este estado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colOrders.map((order) => (
                      <div key={order.id} className="bg-[#111122] rounded-xl p-3.5 shadow-md border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-base font-black text-indigo-300 bg-[#050508] border border-slate-800 px-2 py-0.5 rounded">
                            {order.plate}
                          </span>
                          {order.spotId && (
                            <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
                              Espacio {order.spotId}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-200">{order.serviceName}</div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            {order.assignedOperator}
                          </span>
                          <span className="font-extrabold text-emerald-400 font-mono">{formatCurrency(order.price)}</span>
                        </div>

                        {/* Advance status action */}
                        <div className="pt-2 flex items-center justify-end gap-1">
                          {order.status === 'pendiente' && (
                            <button
                              onClick={() => onUpdateWashStatus(order.id, 'en_proceso')}
                              className="w-full bg-indigo-600 text-white hover:bg-indigo-500 text-[11px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer"
                            >
                              ▶️ Iniciar Lavado
                            </button>
                          )}
                          {order.status === 'en_proceso' && (
                            <button
                              onClick={() => onUpdateWashStatus(order.id, 'listo')}
                              className="w-full bg-purple-600 text-white hover:bg-purple-500 text-[11px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer"
                            >
                              ✨ Marcar Listo
                            </button>
                          )}
                          {order.status === 'listo' && (
                            <button
                              onClick={() => onUpdateWashStatus(order.id, 'entregado')}
                              className="w-full bg-emerald-600 text-white hover:bg-emerald-500 text-[11px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer"
                            >
                              ✅ Entregar Vehículo
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Nueva Orden de Lavado
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Patente Vehículo *</label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Ej: KDJF-84"
                  className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 text-center text-lg font-mono font-bold text-white outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Servicio de Lavado *</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 font-bold text-slate-200 outline-hidden focus:border-indigo-500"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {formatCurrency(s.price)} (~{s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Vincular a Vehículo Estacionado (Opcional)</label>
                <select
                  value={linkedSpotId}
                  onChange={(e) => setLinkedSpotId(e.target.value)}
                  className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 text-slate-200 outline-hidden focus:border-indigo-500"
                >
                  <option value="">-- Lavado Independiente (Sin spot) --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.spotId}>
                      Patente {v.plate} (Espacio {v.spotId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Operario Asignado</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="Nombre de operario"
                  className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 outline-hidden text-slate-200 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold cursor-pointer hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-500 shadow-md shadow-indigo-900/40"
                >
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Create/Edit Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                {editingService ? 'Modificar Servicio de Lavado' : 'Agregar Nuevo Servicio de Lavado'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  value={serviceFormName}
                  onChange={(e) => setServiceFormName(e.target.value)}
                  placeholder="Ej: Lavado Detallado Chasis y Motor"
                  className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 text-slate-100 font-bold outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Categoría *</label>
                  <select
                    value={serviceFormCategory}
                    onChange={(e) => setServiceFormCategory(e.target.value)}
                    className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="exterior">Exterior</option>
                    <option value="interior">Interior</option>
                    <option value="completo">Completo</option>
                    <option value="detallado">Detallado</option>
                    <option value="motor">Motor</option>
                    <option value="especial">Especial / Sanitize</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Duración (min) *</label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={serviceFormDuration}
                    onChange={(e) => setServiceFormDuration(parseInt(e.target.value) || 15)}
                    className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 text-slate-100 font-bold outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Precio del Servicio (CLP $) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={serviceFormPrice}
                    onChange={(e) => setServiceFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 pl-7 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descripción del Servicio</label>
                <textarea
                  rows={3}
                  value={serviceFormDescription}
                  onChange={(e) => setServiceFormDescription(e.target.value)}
                  placeholder="Detalle los procesos incluidos en el lavado..."
                  className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold cursor-pointer hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-500 shadow-md shadow-indigo-900/40"
                >
                  {editingService ? 'Guardar Cambios' : 'Agregar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
