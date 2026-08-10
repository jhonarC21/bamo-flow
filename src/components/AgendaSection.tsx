import React, { useState } from 'react';
import { Booking, BookingStatus, CarWashService } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Calendar, Check, Clock, Plus, Search, Sparkles, User, Phone, Car, X, ShieldCheck, ArrowRight } from 'lucide-react';

interface AgendaSectionProps {
  bookings: Booking[];
  washServices: CarWashService[];
  onAddBooking: (booking: Omit<Booking, 'id'>) => void;
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  onConvertBookingToEntry: (booking: Booking) => void;
}

const statusBadges: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  confirmada: { label: 'Confirmada', bg: 'bg-emerald-950/80 border border-emerald-500/40', text: 'text-emerald-400' },
  pendiente: { label: 'Pendiente', bg: 'bg-amber-950/80 border border-amber-500/40', text: 'text-amber-400' },
  completada: { label: 'Completada', bg: 'bg-indigo-950/80 border border-indigo-500/40', text: 'text-indigo-400' },
  cancelada: { label: 'Cancelada', bg: 'bg-slate-900 border border-slate-800', text: 'text-slate-500' },
};

export const AgendaSection: React.FC<AgendaSectionProps> = ({
  bookings,
  washServices,
  onAddBooking,
  onUpdateBookingStatus,
  onConvertBookingToEntry,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Booking form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00');
  const [serviceType, setServiceType] = useState<'estacionamiento' | 'lavado' | 'ambos'>('ambos');
  const [washServiceId, setWashServiceId] = useState<string>(washServices[0]?.id || '');
  const [notes, setNotes] = useState('');

  const filteredBookings = bookings.filter((b) => {
    if (b.date !== selectedDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.clientName.toLowerCase().includes(q) || b.plate.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !plate.trim()) return;

    onAddBooking({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      plate: plate.trim().toUpperCase(),
      date: selectedDate,
      timeSlot,
      serviceType,
      washServiceId: serviceType !== 'estacionamiento' ? washServiceId : undefined,
      status: 'confirmada',
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
    setClientName('');
    setClientPhone('');
    setPlate('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-[#0a0a12] to-[#0d0d1a] text-white rounded-3xl p-6 border border-indigo-500/30 shadow-xl shadow-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Agenda & Gestión de Reservas</h2>
            <p className="text-xs text-slate-400">Programación de cupos de estacionamiento y citas de lavado.</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50 transition-all cursor-pointer whitespace-nowrap border border-indigo-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nueva Reserva</span>
        </button>
      </div>

      {/* Date & Filter Bar */}
      <div className="bg-[#0d0d1a] p-4 rounded-2xl border border-slate-800/60 shadow-xl shadow-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#111122] border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 outline-hidden focus:border-indigo-500"
          />
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedDate === todayStr ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Hoy
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente o patente..."
            className="w-full bg-[#111122] border border-slate-800 text-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs outline-hidden focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Booking Cards Grid */}
      {filteredBookings.length === 0 ? (
        <div className="bg-[#0d0d1a] rounded-3xl p-12 text-center border border-slate-800/60 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-100 text-base">No hay reservas programadas para esta fecha</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Haga clic en el botón "Agendar Nueva Reserva" para programar un turno de lavado o un cupo reservado de estacionamiento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const badge = statusBadges[b.status];
            const washService = washServices.find((s) => s.id === b.washServiceId);

            return (
              <div key={b.id} className="bg-[#0d0d1a] rounded-2xl p-5 border border-slate-800/60 shadow-xl shadow-black/20 hover:border-indigo-500/50 transition-all space-y-4">
                
                {/* Header: Time & Status */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-mono text-sm font-black px-2.5 py-1 rounded-lg">
                      ⏰ {b.timeSlot}
                    </span>
                    <span className="text-xs font-bold text-slate-300 capitalize">
                      {b.serviceType === 'ambos' ? 'Estac. + Lavado' : b.serviceType}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Client & Plate details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-black text-indigo-300 bg-[#050508] border border-slate-800 px-2.5 py-0.5 rounded">
                      {b.plate}
                    </span>
                    {b.clientPhone && (
                      <a href={`tel:${b.clientPhone}`} className="text-indigo-400 font-semibold flex items-center gap-1 hover:underline">
                        <Phone className="w-3 h-3 text-indigo-400" /> {b.clientPhone}
                      </a>
                    )}
                  </div>

                  <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    {b.clientName}
                  </div>

                  {washService && (
                    <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/30 text-[11px] text-indigo-300 font-medium">
                      ✨ {washService.name} (<span className="font-mono text-emerald-400">{formatCurrency(washService.price)}</span>)
                    </div>
                  )}

                  {b.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-[#111122] p-2 rounded-lg border border-slate-800">
                      "{b.notes}"
                    </p>
                  )}
                </div>

                {/* Conversion & Status Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onConvertBookingToEntry(b)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <span>Ingresar Ahora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <select
                    value={b.status}
                    onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as BookingStatus)}
                    className="bg-[#111122] border border-slate-800 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-300 outline-hidden focus:border-indigo-500"
                  >
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* New Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Agendar Reserva
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nombre Cliente *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Laura Morales"
                  className="w-full bg-[#111122] border border-slate-700/60 text-white rounded-xl p-2.5 font-bold outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Teléfono Contacto</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+569 ..."
                    className="w-full bg-[#111122] border border-slate-700/60 text-white rounded-xl p-2.5 outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Patente Vehículo *</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="BVCX-77"
                    className="w-full bg-[#111122] border border-slate-700/60 rounded-xl p-2.5 font-mono font-bold uppercase text-white outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Hora de la Reserva</label>
                  <input
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 font-bold outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tipo de Servicio</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 font-bold outline-hidden focus:border-indigo-500"
                  >
                    <option value="ambos">Estacionamiento + Lavado</option>
                    <option value="lavado">Solo Servicio de Lavado</option>
                    <option value="estacionamiento">Solo Estacionamiento</option>
                  </select>
                </div>
              </div>

              {serviceType !== 'estacionamiento' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Servicio de Lavado Elegido</label>
                  <select
                    value={washServiceId}
                    onChange={(e) => setWashServiceId(e.target.value)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 font-bold outline-hidden focus:border-indigo-500"
                  >
                    {washServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {formatCurrency(s.price)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 outline-hidden focus:border-indigo-500"
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
                  Guardar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
