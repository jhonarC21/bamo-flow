import React, { useState } from 'react';
import { Booking, ClientReview, Transaction, VehicleClientRecord, VehicleType, ClientCategory, ActiveVehicle } from '../types';
import { formatCurrency, formatDuration } from '../utils/pricing';
import {
  TrendingUp,
  Users,
  Star,
  ShieldAlert,
  Calendar,
  Car,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Lock,
  Award,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface MetricsCrmSectionProps {
  clientRecords: VehicleClientRecord[];
  clientReviews: ClientReview[];
  bookings: Booking[];
  transactions: Transaction[];
  activeVehicles: ActiveVehicle[];
  onAddClientRecord: (record: Omit<VehicleClientRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateClientRecord: (id: string, updates: Partial<VehicleClientRecord>) => void;
  onDeleteClientRecord: (id: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: 'confirmada' | 'cancelada') => void;
  onConvertBookingToEntry: (booking: Booking) => void;
}

export const MetricsCrmSection: React.FC<MetricsCrmSectionProps> = ({
  clientRecords,
  clientReviews,
  bookings,
  transactions,
  activeVehicles,
  onAddClientRecord,
  onUpdateClientRecord,
  onDeleteClientRecord,
  onUpdateBookingStatus,
  onConvertBookingToEntry,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'metricas' | 'agendas' | 'vip_alertas' | 'database'>('metricas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for adding/editing database client record
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VehicleClientRecord | null>(null);

  // Record Form state
  const [formData, setFormData] = useState({
    plate: '',
    make: '',
    model: '',
    color: '',
    year: 2024,
    vehicleType: 'auto' as VehicleType,
    clientName: '',
    clientRut: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    category: 'normal' as ClientCategory,
    internalNotes: '',
  });

  // Reset form
  const handleOpenNewRecord = () => {
    setEditingRecord(null);
    setFormData({
      plate: '',
      make: '',
      model: '',
      color: '',
      year: new Date().getFullYear(),
      vehicleType: 'auto',
      clientName: '',
      clientRut: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
      category: 'normal',
      internalNotes: '',
    });
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecord = (record: VehicleClientRecord) => {
    setEditingRecord(record);
    setFormData({
      plate: record.plate,
      make: record.make,
      model: record.model,
      color: record.color,
      year: record.year,
      vehicleType: record.vehicleType,
      clientName: record.clientName,
      clientRut: record.clientRut,
      clientPhone: record.clientPhone,
      clientEmail: record.clientEmail,
      clientAddress: record.clientAddress,
      category: record.category,
      internalNotes: record.internalNotes || '',
    });
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      onUpdateClientRecord(editingRecord.id, {
        ...formData,
        plate: formData.plate.toUpperCase().trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddClientRecord({
        ...formData,
        plate: formData.plate.toUpperCase().trim(),
      });
    }
    setIsRecordModalOpen(false);
  };

  // Metrics calculations
  const pendingBookings = bookings.filter((b) => b.status === 'pendiente');
  const vipClients = clientRecords.filter((c) => c.category === 'vip');
  const flaggedClients = clientRecords.filter((c) => c.category === 'mala_resena' || (c.rating && c.rating <= 2));

  // Compute Plate Frequency Statistics from transactions + active vehicles + records
  const plateStatsMap = new Map<
    string,
    {
      plate: string;
      visitCount: number;
      totalSpent: number;
      clientName: string;
      vehicleType: string;
      category: ClientCategory;
      lastVisit: string;
    }
  >();

  // Process transactions
  transactions.forEach((tx) => {
    if (!tx.plate) return;
    const plate = tx.plate.toUpperCase();
    const existing = plateStatsMap.get(plate) || {
      plate,
      visitCount: 0,
      totalSpent: 0,
      clientName: 'Cliente Ocasional',
      vehicleType: tx.vehicleType || 'auto',
      category: 'normal',
      lastVisit: tx.date,
    };

    existing.visitCount += 1;
    existing.totalSpent += tx.total;
    if (new Date(tx.date) > new Date(existing.lastVisit)) {
      existing.lastVisit = tx.date;
    }
    plateStatsMap.set(plate, existing);
  });

  // Enrich with client records
  clientRecords.forEach((rec) => {
    const plate = rec.plate.toUpperCase();
    const existing = plateStatsMap.get(plate) || {
      plate,
      visitCount: 1,
      totalSpent: 0,
      clientName: rec.clientName,
      vehicleType: rec.vehicleType,
      category: rec.category,
      lastVisit: rec.updatedAt,
    };
    existing.clientName = rec.clientName;
    existing.category = rec.category;
    existing.vehicleType = rec.vehicleType;
    plateStatsMap.set(plate, existing);
  });

  const plateFrequencyList = Array.from(plateStatsMap.values()).sort((a, b) => b.visitCount - a.visitCount);

  // Filtered Client Records for DB tab
  const filteredRecords = clientRecords.filter((r) => {
    const query = searchTerm.toLowerCase();
    return (
      r.plate.toLowerCase().includes(query) ||
      r.clientName.toLowerCase().includes(query) ||
      r.clientRut.toLowerCase().includes(query) ||
      r.make.toLowerCase().includes(query) ||
      r.model.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Overview */}
      <div className="bg-[#0d0d1a] p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                Panel de Métricas & CRM
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                Uso Interno Exclusivo del Personal
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 mt-1">
              Frecuencia de Vehículos, Agendas y Gestión de Clientes
            </h1>
          </div>

          <button
            onClick={handleOpenNewRecord}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/50 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente / Vehículo</span>
          </button>
        </div>

        {/* 4 Key KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-[#050508] p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Patentes Registradas</span>
              <div className="text-xl font-black text-slate-100 font-mono">{plateStatsMap.size}</div>
              <span className="text-[10px] text-indigo-400">Top visitas por frecuencia</span>
            </div>
          </div>

          <div className="bg-[#050508] p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Agendas Pendientes</span>
              <div className="text-xl font-black text-amber-400 font-mono">{pendingBookings.length}</div>
              <span className="text-[10px] text-amber-300">Por aceptar o rechazar</span>
            </div>
          </div>

          <div className="bg-[#050508] p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Clientes VIP</span>
              <div className="text-xl font-black text-emerald-400 font-mono">{vipClients.length}</div>
              <span className="text-[10px] text-emerald-300">Trato prioritario</span>
            </div>
          </div>

          <div className="bg-[#050508] p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Mala Reseña / Alertas</span>
              <div className="text-xl font-black text-red-400 font-mono">{flaggedClients.length}</div>
              <span className="text-[10px] text-red-300">Alertas registradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('metricas')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'metricas'
              ? 'bg-[#0d0d1a] text-indigo-400 border-t-2 border-x border-slate-800 border-t-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Frecuencia por Patente</span>
        </button>

        <button
          onClick={() => setActiveSubTab('agendas')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === 'agendas'
              ? 'bg-[#0d0d1a] text-indigo-400 border-t-2 border-x border-slate-800 border-t-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agendas Pendientes</span>
          {pendingBookings.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('vip_alertas')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'vip_alertas'
              ? 'bg-[#0d0d1a] text-indigo-400 border-t-2 border-x border-slate-800 border-t-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-4 h-4 text-amber-400" />
          <span>Clientes VIP & Mala Reseña</span>
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-[#0d0d1a] text-indigo-400 border-t-2 border-x border-slate-800 border-t-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Base de Datos Interna</span>
        </button>
      </div>

      {/* SUB-TAB 1: FRECUENCIA DE INGRESO POR PATENTE */}
      {activeSubTab === 'metricas' && (
        <div className="bg-[#0d0d1a] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Frecuencia de Visitas por Patente</h3>
              <p className="text-xs text-slate-400">Ranking de vehículos con mayor recurrencia e ingresos acumulados</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar patente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050508] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#050508] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Patente</th>
                  <th className="py-3 px-4">Cliente Asociado</th>
                  <th className="py-3 px-4 text-center">Nº Visitas</th>
                  <th className="py-3 px-4 text-right">Total Invertido</th>
                  <th className="py-3 px-4">Categoría CRM</th>
                  <th className="py-3 px-4">Última Visita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {plateFrequencyList
                  .filter((p) => p.plate.toLowerCase().includes(searchTerm.toLowerCase()) || p.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item, idx) => (
                    <tr key={item.plate} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-300">
                        <span className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                          {item.plate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-semibold">{item.clientName}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-200 font-mono">
                          {item.visitCount} {item.visitCount === 1 ? 'visita' : 'visitas'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-bold">
                        {formatCurrency(item.totalSpent)}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.category === 'vip' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                            <Star className="w-3 h-3 fill-amber-400" /> VIP
                          </span>
                        )}
                        {item.category === 'mala_resena' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/40 flex items-center gap-1 w-fit">
                            <ShieldAlert className="w-3 h-3" /> Mala Reseña
                          </span>
                        )}
                        {item.category === 'normal' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 w-fit">
                            Estándar
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {new Date(item.lastVisit).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AGENDAS PENDIENTES POR ACEPTAR O RECHAZAR */}
      {activeSubTab === 'agendas' && (
        <div className="bg-[#0d0d1a] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Agendas Solicitadas por Clientes</h3>
              <p className="text-xs text-slate-400">Revise y apruebe o rechace las reservas web ingresadas por los clientes</p>
            </div>
            <span className="px-3 py-1 bg-amber-950 text-amber-400 border border-amber-500/30 rounded-xl font-mono text-xs font-bold">
              {pendingBookings.length} Pendientes
            </span>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="text-center py-10 bg-[#050508] rounded-2xl border border-slate-800 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-slate-200 text-sm">¡No hay solicitudes pendientes!</h4>
              <p className="text-xs text-slate-400">Todas las reservas ingresadas por clientes han sido procesadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#050508] rounded-2xl p-4.5 border border-amber-500/40 shadow-xl space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-black text-indigo-300 bg-indigo-950 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                      {b.plate}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse">
                      PENDIENTE DE APROBACIÓN
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-400" />
                      {b.clientName}
                    </div>
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {b.clientPhone}
                    </div>
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Fecha: <strong className="text-slate-200 font-mono">{b.date}</strong> a las <strong className="text-indigo-400 font-mono">{b.timeSlot} hrs</strong></span>
                    </div>
                    {b.notes && (
                      <div className="text-slate-400 bg-[#111122] p-2 rounded-xl text-[11px] border border-slate-800 mt-1">
                        💬 <em>"{b.notes}"</em>
                      </div>
                    )}
                  </div>

                  {/* Actions: Accept or Reject */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => onUpdateBookingStatus(b.id, 'cancelada')}
                      className="flex-1 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>

                    <button
                      onClick={() => onUpdateBookingStatus(b.id, 'confirmada')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Aceptar Agenda</span>
                    </button>

                    <button
                      onClick={() => onConvertBookingToEntry(b)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                      title="Ingresar directamente al patio"
                    >
                      <Car className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CLIENTES VIP & CLIENTES CON MALA RESEÑA */}
      {activeSubTab === 'vip_alertas' && (
        <div className="space-y-6">
          {/* Section 1: VIP Clients */}
          <div className="bg-[#0d0d1a] rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Clientes VIP Registrados</h3>
                  <p className="text-xs text-slate-400">Clientes preferenciales con atención prioritaria</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-500/40 rounded-xl font-mono text-xs font-bold">
                {vipClients.length} VIPs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vipClients.map((client) => (
                <div key={client.id} className="bg-[#050508] p-4 rounded-2xl border border-amber-500/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-sm text-slate-100">{client.clientName}</span>
                      <span className="block text-xs text-slate-400 font-mono">RUT: {client.clientRut}</span>
                    </div>
                    <span className="font-mono font-black text-xs text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                      {client.plate}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800">
                    <div>🚗 Vehículo: <strong className="text-white">{client.make} {client.model} ({client.color} - {client.year})</strong></div>
                    <div>📞 Contacto: <span className="text-slate-400">{client.clientPhone} • {client.clientEmail}</span></div>
                    {client.internalNotes && (
                      <div className="text-amber-300/90 text-[11px] bg-amber-950/40 p-2 rounded-xl border border-amber-500/20 mt-1">
                        ⭐ Note: {client.internalNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Flagged / Bad Review Clients */}
          <div className="bg-[#0d0d1a] rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Clientes con Mala Reseña o Alerta de Servicio</h3>
                  <p className="text-xs text-slate-400">Historial de comentarios negativos o alertas de conducta registradas</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-red-950 text-red-300 border border-red-500/40 rounded-xl font-mono text-xs font-bold">
                {flaggedClients.length} Alertas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedClients.map((client) => (
                <div key={client.id} className="bg-[#050508] p-4 rounded-2xl border border-red-500/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-sm text-red-400">{client.clientName}</span>
                      <span className="block text-xs text-slate-400 font-mono">RUT: {client.clientRut}</span>
                    </div>
                    <span className="font-mono font-black text-xs text-slate-200 bg-red-950 px-2 py-0.5 rounded border border-red-500/40">
                      {client.plate}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800">
                    <div>🚗 Vehículo: <strong className="text-white">{client.make} {client.model} ({client.color})</strong></div>
                    <div>📞 Contacto: <span className="text-slate-400">{client.clientPhone}</span></div>
                    {client.internalNotes && (
                      <div className="text-red-300 text-[11px] bg-red-950/40 p-2 rounded-xl border border-red-500/20 mt-1">
                        ⚠️ Alerta Interna: {client.internalNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Reviews Left by Customers in Portal */}
          <div className="bg-[#0d0d1a] rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Reseñas Recibidas desde el Portal Web</span>
            </h3>

            <div className="space-y-3">
              {clientReviews.map((rev) => (
                <div key={rev.id} className="bg-[#050508] p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 text-xs">{rev.clientName} ({rev.plate})</span>
                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">"{rev.comment}"</p>
                  <span className="text-[10px] text-slate-500 block">{new Date(rev.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 4: BASE DE DATOS COMPLETA DE VEHÍCULOS Y CLIENTES */}
      {activeSubTab === 'database' && (
        <div className="bg-[#0d0d1a] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">Registro de Vehículos y Clientes</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Uso Interno Personal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Almacén completo de patentes con datos técnicos de vehículos y datos de contacto de clientes
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar patente, nombre, RUT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#050508] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleOpenNewRecord}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Registro</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#050508] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Patente</th>
                  <th className="py-3 px-4">Vehículo</th>
                  <th className="py-3 px-4">Cliente (Nombre / RUT)</th>
                  <th className="py-3 px-4">Contacto (Celular / Email)</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-indigo-300">
                      <span className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                        {r.plate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{r.make} {r.model}</div>
                      <span className="text-[11px] text-slate-400">{r.color} • {r.year} ({r.vehicleType.toUpperCase()})</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{r.clientName}</div>
                      <span className="text-[11px] text-slate-400 font-mono">RUT: {r.clientRut}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{r.clientPhone}</div>
                      <span className="text-[11px] text-slate-400">{r.clientEmail}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-[150px]">
                      {r.clientAddress || 'S/I'}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.category === 'vip' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                          ⭐ VIP
                        </span>
                      )}
                      {r.category === 'mala_resena' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/30">
                          ⚠️ Mala Reseña
                        </span>
                      )}
                      {r.category === 'normal' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditRecord(r)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Editar Registro"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteClientRecord(r.id)}
                          className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 cursor-pointer"
                          title="Eliminar Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR CLIENTE Y VEHÍCULO */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d0d1a] rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
            
            <div className="bg-[#050508] border-b border-slate-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400">
                  <Car className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-100">
                    {editingRecord ? 'Editar Registro de Cliente' : 'Nuevo Registro de Vehículo y Cliente'}
                  </h2>
                  <p className="text-xs text-slate-400">Base de datos interna del personal</p>
                </div>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 text-xs">
              
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Privacidad Interna:</strong> Los datos personales (RUT, teléfono, correo y dirección) son almacenados de forma segura únicamente para el personal.</span>
              </div>

              {/* Data Vehículo */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-indigo-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  1. Datos del Vehículo
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Patente *</label>
                    <input
                      type="text"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      placeholder="Ej: AB-1234"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-indigo-300 uppercase outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Tipo de Vehículo *</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="auto">🚗 Auto</option>
                      <option value="suv">🚙 SUV</option>
                      <option value="camioneta">🛻 Camioneta</option>
                      <option value="moto">🏍️ Moto</option>
                      <option value="furgon">🚐 Furgón</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Marca *</label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      placeholder="Ej: Toyota"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Ej: Corolla"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Color / Año</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="Color"
                        className="w-2/3 bg-[#050508] border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
                        className="w-1/3 bg-[#050508] border border-slate-800 rounded-xl p-2 text-slate-200 font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Cliente */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  2. Datos Personales del Cliente (Manejo Interno)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">RUT Cliente</label>
                    <input
                      type="text"
                      value={formData.clientRut}
                      onChange={(e) => setFormData({ ...formData, clientRut: e.target.value })}
                      placeholder="Ej: 15.482.930-4"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-mono text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Celular / Teléfono</label>
                    <input
                      type="text"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder="+569 8765 4321"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      placeholder="cliente@email.com"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Dirección Domicilio / Empresa</label>
                  <input
                    type="text"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    placeholder="Ej: Av. Las Condes 8900"
                    className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* CRM Tag & Notes */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-amber-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  3. Categoría CRM y Notas Internas
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Categorización del Cliente</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ClientCategory })}
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="normal">👤 Cliente Normal / Estándar</option>
                      <option value="vip">⭐ Cliente VIP (Trato Prioritario)</option>
                      <option value="mala_resena">⚠️ Cliente con Mala Reseña / Alerta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Observaciones Internas</label>
                    <input
                      type="text"
                      value={formData.internalNotes}
                      onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                      placeholder="Ej: Prefiere cera sintética, paga con factura"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-lg shadow-indigo-950/50"
                >
                  {editingRecord ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
