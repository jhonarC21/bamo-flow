import React, { useState } from 'react';
import { ChargingMode, RateConfig, AppConfig, Printer58mmConfig, StaffUser, UserRole } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Check, Info, Settings, ShieldAlert, X, Printer, Image, CreditCard, Lock, KeyRound, Sparkles, UserCheck, Users, Plus, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RateConfig;
  appConfig: AppConfig;
  staffUsers?: StaffUser[];
  onSaveConfig: (newRateConfig: RateConfig, newAppConfig: AppConfig) => void;
  onUpdateStaffUsers?: (users: StaffUser[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  appConfig,
  staffUsers = [],
  onSaveConfig,
  onUpdateStaffUsers,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'tarifas' | 'ticket' | 'impresora' | 'branding' | 'seguridad' | 'usuarios'>('tarifas');

  // Staff users state for PINs and salaries
  const [localUsers, setLocalUsers] = useState<StaffUser[]>(staffUsers);

  // Rate config state
  const [mode, setMode] = useState<ChargingMode>(config.mode);
  const [minuteRate, setMinuteRate] = useState<number>(config.minuteRate);
  const [firstBlockMinutes, setFirstBlockMinutes] = useState<number>(config.firstBlockMinutes);
  const [firstBlockPrice, setFirstBlockPrice] = useState<number>(config.firstBlockPrice);
  const [subsequentBlockPrice, setSubsequentBlockPrice] = useState<number>(config.subsequentBlockPrice);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(config.gracePeriodMinutes);
  
  // App branding & printer state
  const [appTitle, setAppTitle] = useState<string>(appConfig?.appTitle || 'AutoPark & CarWash Control');
  const [logoUrl, setLogoUrl] = useState<string>(appConfig?.logoUrl || '');
  const [cardFeePercentage, setCardFeePercentage] = useState<number>(appConfig?.cardFeePercentage ?? 2.5);
  const [appPin, setAppPin] = useState<string>(appConfig?.appPin || '12345678');
  
  // 58mm Printer params
  const [printer58mm, setPrinter58mm] = useState<Printer58mmConfig>(
    appConfig?.printer58mm || {
      widthMm: 58,
      headerText: 'AUTOPARK & CAR WASH CONTROL',
      footerText: '¡Gracias por su preferencia! Conserve este comprobante.',
      showQr: true,
      fontSizePx: 12,
    }
  );

  const [warningMsg, setWarningMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Rule enforcement check: First block cannot be less than 30 minutes
    if (firstBlockMinutes < 30) {
      setWarningMsg('El primer tramo NO puede ser menor a 30 minutos por reglamentación.');
      return;
    }

    // Min 8 digits PIN validation
    if (appPin.length < 8) {
      setWarningMsg('La clave de bloqueo debe tener al menos 8 dígitos por seguridad.');
      return;
    }

    const updatedRateConfig: RateConfig = {
      ...config,
      mode,
      minuteRate: Math.max(1, minuteRate),
      firstBlockMinutes: Math.max(30, firstBlockMinutes),
      firstBlockPrice: Math.max(1, firstBlockPrice),
      subsequentBlockMinutes: 10,
      subsequentBlockPrice: Math.max(1, subsequentBlockPrice),
      gracePeriodMinutes: Math.max(0, gracePeriodMinutes),
    };

    const updatedAppConfig: AppConfig = {
      ...appConfig,
      appTitle,
      logoUrl,
      cardFeePercentage: Math.max(0, cardFeePercentage),
      appPin,
      printer58mm,
    };

    onSaveConfig(updatedRateConfig, updatedAppConfig);
    if (onUpdateStaffUsers) {
      onUpdateStaffUsers(localUsers);
    }
    onClose();
  };

  const handleUpdateUserPin = (id: string, newPin: string) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, pin: newPin } : u))
    );
  };

  const handleUpdateUserRut = (id: string, newRut: string) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, rut: newRut } : u))
    );
  };

  const handleUpdateUserBaseSalary = (id: string, salary: number) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, baseSalary: salary } : u))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d0d1a] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
        
        {/* Header */}
        <div className="bg-[#050508] border-b border-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Configuración del Sistema</h2>
              <p className="text-xs text-slate-400">Tarifas, Impresora 58mm, Branding y Seguridad</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#070712] p-1.5 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('tarifas')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tarifas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>⏱️ Tarifas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ticket'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🎫 Datos Ticket</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('impresora')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'impresora'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Impresora 58mm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Logo y Título</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seguridad')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'seguridad'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Seguridad y Pagos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usuarios')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'usuarios'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios & Claves</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {warningMsg && (
            <div className="bg-red-950/80 text-red-400 p-3 rounded-xl border border-red-500/30 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* TAB 1: TARIFAS */}
          {activeTab === 'tarifas' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Modalidad de Cobro Predeterminada
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('tramo')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      mode === 'tramo'
                        ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold shadow-md'
                        : 'border-slate-800 bg-[#111122] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-xs mb-1 text-slate-200">⏱️ Cobro por Tramo</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Primer tramo (mín 30m) + Tramos de 10 minutos
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('minuto')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      mode === 'minuto'
                        ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold shadow-md'
                        : 'border-slate-800 bg-[#111122] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-xs mb-1 text-slate-200">⚡ Cobro por Minuto Efectivo</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Tarifa proporcional por minuto exacto transcurrido
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Valores del Cobro por Tramo
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">
                      Duración 1º Tramo (Minutos) *
                    </label>
                    <input
                      type="number"
                      min={30}
                      value={firstBlockMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 30;
                        setFirstBlockMinutes(val < 30 ? 30 : val);
                        setWarningMsg('');
                      }}
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">Mínimo obligatorio: 30 min</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">
                      Precio 1º Tramo ($) *
                    </label>
                    <input
                      type="number"
                      value={firstBlockPrice}
                      onChange={(e) => setFirstBlockPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-emerald-400 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">
                      Tramos Siguientes (Fijo)
                    </label>
                    <input
                      type="text"
                      value="10 minutos"
                      disabled
                      className="w-full bg-[#050508] border border-slate-800/60 rounded-xl p-2.5 font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">
                      Precio Tramo Extra ($) *
                    </label>
                    <input
                      type="number"
                      value={subsequentBlockPrice}
                      onChange={(e) => setSubsequentBlockPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-emerald-400 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Valores del Cobro por Minuto y Tolerancia
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">
                      Valor por Minuto Efectivo ($)
                    </label>
                    <input
                      type="number"
                      value={minuteRate}
                      onChange={(e) => setMinuteRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-emerald-400 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">
                      Minutos de Tolerancia (Grátis)
                    </label>
                    <input
                      type="number"
                      value={gracePeriodMinutes}
                      onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATOS DEL TICKET DE ESTACIONAMIENTO */}
          {activeTab === 'ticket' && (
            <div className="space-y-4">
              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2">
                  <Printer className="w-4 h-4" />
                  <span>Datos y Diseño del Ticket de Estacionamiento</span>
                </div>

                {/* 1. LOGO DEL TICKET */}
                <div className="space-y-2 bg-[#0d0d1a] p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Incluir Logotipo en el Ticket</span>
                      <span className="text-[10px] text-slate-400">Imprime el logo de su empresa en el encabezado</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={printer58mm.showLogo ?? true}
                      onChange={(e) => setPrinter58mm({ ...printer58mm, showLogo: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  {(printer58mm.showLogo ?? true) && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <label className="block font-bold text-slate-300 mb-1">
                        URL del Logo para el Ticket
                      </label>
                      <input
                        type="url"
                        value={printer58mm.logoUrl || ''}
                        onChange={(e) => setPrinter58mm({ ...printer58mm, logoUrl: e.target.value })}
                        placeholder={logoUrl || 'https://ejemplo.com/logo-ticket.png'}
                        className="w-full bg-[#111122] border border-slate-800 rounded-xl p-2.5 font-bold text-indigo-300 outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Si se deja en blanco, usará el logo principal de la empresa ({logoUrl ? 'Configurado' : 'Sin definir'}).
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. TAMAÑO DE LA FUENTE DEL TICKET */}
                <div className="bg-[#0d0d1a] p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200">
                      Tamaño de la Fuente del Ticket (px)
                    </label>
                    <span className="font-mono font-black text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded text-xs">
                      {printer58mm.fontSizePx || 11} px
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500">8px</span>
                    <input
                      type="range"
                      min={8}
                      max={18}
                      step={1}
                      value={printer58mm.fontSizePx || 11}
                      onChange={(e) => setPrinter58mm({ ...printer58mm, fontSizePx: parseInt(e.target.value) || 11 })}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-500">18px</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Ajusta la legibilidad para su impresora térmica de 58mm.</span>
                </div>

                {/* 3. TEXTO DESTACADO DEL TICKET */}
                <div className="bg-[#0d0d1a] p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="block font-bold text-slate-200">
                    Texto Destacado del Ticket (Mensaje de Advertencia o Promoción)
                  </label>
                  <input
                    type="text"
                    value={printer58mm.featuredText || ''}
                    onChange={(e) => setPrinter58mm({ ...printer58mm, featuredText: e.target.value })}
                    placeholder="Ej: CONSERVE SU TICKET - SI LO PIERDE MULTA DE $10.000"
                    className="w-full bg-[#111122] border border-slate-800 rounded-xl p-2.5 font-bold text-amber-300 outline-none focus:border-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 self-center">Atajos rápidos:</span>
                    <button
                      type="button"
                      onClick={() => setPrinter58mm({ ...printer58mm, featuredText: 'CONSERVE SU TICKET - SI LO PIERDE MULTA DE $10.000' })}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Multa Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinter58mm({ ...printer58mm, featuredText: '¡REVISE SUS PERTENENCIAS ANTES DE RETIRARSE!' })}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Recordatorio Pertenencias
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinter58mm({ ...printer58mm, featuredText: 'ESTACIONAMIENTO MONITOREADO 24/7 CON CÁMARAS' })}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Monitoreo 24/7
                    </button>
                  </div>
                </div>

                {/* 4. ENCABEZADO Y DATOS DE EMPRESA PARA BOLETA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Razón Social / Nombre Comercial
                    </label>
                    <input
                      type="text"
                      value={printer58mm.headerText}
                      onChange={(e) => setPrinter58mm({ ...printer58mm, headerText: e.target.value })}
                      placeholder="Ej: Bamo garage spa"
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      RUT Empresa
                    </label>
                    <input
                      type="text"
                      value={printer58mm.companyRut || ''}
                      onChange={(e) => setPrinter58mm({ ...printer58mm, companyRut: e.target.value })}
                      placeholder="Ej: 78.084.649-6"
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Dirección Sucursal / Patio
                    </label>
                    <input
                      type="text"
                      value={printer58mm.companyAddress || ''}
                      onChange={(e) => setPrinter58mm({ ...printer58mm, companyAddress: e.target.value })}
                      placeholder="Ej: Cobija 2058"
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-medium text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Jurisdicción SII
                    </label>
                    <input
                      type="text"
                      value={printer58mm.companySii || ''}
                      onChange={(e) => setPrinter58mm({ ...printer58mm, companySii: e.target.value })}
                      placeholder="Ej: SII CALAMA"
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-medium text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-300 mb-1">
                      Pie de Página (Mensaje al Pie)
                    </label>
                    <input
                      type="text"
                      value={printer58mm.footerText}
                      onChange={(e) => setPrinter58mm({ ...printer58mm, footerText: e.target.value })}
                      placeholder="Ej: ¡Gracias por su preferencia!"
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-medium text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* PREVISUALIZACIÓN VIVA DEL TICKET EN PANTALLA */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="block font-bold text-slate-400 mb-2 uppercase text-[10px] tracking-wider">
                    👁️ Previsualización del Ticket Térmico (58mm)
                  </span>
                  <div className="flex justify-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div
                      className="bg-white text-black p-3 rounded shadow-md text-center font-mono leading-tight w-[200px]"
                      style={{ fontSize: `${printer58mm.fontSizePx || 11}px` }}
                    >
                      {(printer58mm.showLogo ?? true) && (printer58mm.logoUrl || logoUrl) && (
                        <img
                          src={printer58mm.logoUrl || logoUrl}
                          alt="Logo Ticket"
                          className="max-h-8 w-auto object-contain mx-auto mb-1"
                        />
                      )}
                      <div className="font-black uppercase tracking-tight border-b-2 border-dashed border-black pb-1 mb-1 leading-snug">
                        <div>{printer58mm.headerText || 'Bamo garage spa'}</div>
                        <div className="text-[9px] font-bold">Rut: {printer58mm.companyRut || '78.084.649-6'}</div>
                        <div className="text-[9px] font-normal">{printer58mm.companyAddress || 'Cobija 2058'}</div>
                        <div className="text-[9px] font-bold">{printer58mm.companySii || 'SII CALAMA'}</div>
                        <div className="text-[10px] font-black pt-0.5 border-t border-gray-300 mt-0.5">boleta N° 10001</div>
                      </div>

                      {printer58mm.featuredText && (
                        <div className="my-1 p-1 border border-black bg-yellow-100 font-extrabold uppercase text-[9px] leading-tight">
                          ★ {printer58mm.featuredText} ★
                        </div>
                      )}

                      <div className="text-left text-[9px] space-y-1 py-1">
                        <div className="font-bold uppercase text-center border-b border-gray-300 pb-0.5">
                          Detalle del servicio o producto
                        </div>
                        <div>* 60 minutos valor $1.800</div>
                        <div className="pt-1 border-t border-gray-300 space-y-0.5">
                          <div className="flex justify-between"><span>monto neto:</span><span>$1.513</span></div>
                          <div className="flex justify-between font-bold"><span>IVA:</span><span>$287</span></div>
                          <div className="flex justify-between font-black text-black"><span>TOTAL:</span><span>$1.800</span></div>
                        </div>
                        <div className="pt-0.5 border-t border-gray-300 flex justify-between font-bold">
                          <span>Forma de pago:</span>
                          <span className="uppercase">Efectivo</span>
                        </div>
                      </div>

                      {printer58mm.showQr && (
                        <div className="pt-1 border-t border-dashed border-black text-[8px] text-gray-700">
                          {printer58mm.footerText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: IMPRESORA 58mm */}
          {activeTab === 'impresora' && (
            <div className="space-y-4">
              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2">
                  <Printer className="w-4 h-4" />
                  <span>Ajustes de Impresora Térmica de 58mm</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Ancho de Impresión (mm)
                  </label>
                  <input
                    type="number"
                    value={printer58mm.widthMm}
                    onChange={(e) => setPrinter58mm({ ...printer58mm, widthMm: parseInt(e.target.value) || 58 })}
                    className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-slate-200 outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Estructurado para rollos estándar de 58mm POS</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Encabezado del Ticket
                  </label>
                  <input
                    type="text"
                    value={printer58mm.headerText}
                    onChange={(e) => setPrinter58mm({ ...printer58mm, headerText: e.target.value })}
                    placeholder="Eje: AUTOPARK SANTIAGO CENTRAL"
                    className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Pie de Página del Ticket
                  </label>
                  <textarea
                    rows={2}
                    value={printer58mm.footerText}
                    onChange={(e) => setPrinter58mm({ ...printer58mm, footerText: e.target.value })}
                    placeholder="Mensaje al cliente en el comprobante..."
                    className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-medium text-slate-200 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-bold text-slate-200 block">Incluir Código QR en Ticket</span>
                    <span className="text-[10px] text-slate-400">Genera código QR rápido para lectura en caja o por el cliente</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={printer58mm.showQr}
                    onChange={(e) => setPrinter58mm({ ...printer58mm, showQr: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & TITULO */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2">
                  <Image className="w-4 h-4" />
                  <span>Personalización de Título y Logo de la Empresa</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Título de la Aplicación
                  </label>
                  <input
                    type="text"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="Ej: AutoPark Santiago & CarWash"
                    className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    URL del Logo de la Empresa
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://ejemplo.com/mi-logo.png"
                    className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold text-indigo-300 outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Formatos recomendados: PNG o SVG transparente</span>
                </div>

                {logoUrl && (
                  <div className="bg-[#050508] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Vista Previa del Logo:</span>
                    <img src={logoUrl} alt="Preview" className="h-10 w-auto object-contain rounded" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SEGURIDAD Y PAGOS CON TARJETA */}
          {activeTab === 'seguridad' && (
            <div className="space-y-4">
              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Comisión de Transacción con Tarjeta</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Porcentaje de Descuento Prestadora de Servicio (% Tarjeta)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={cardFeePercentage}
                      onChange={(e) => setCardFeePercentage(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-amber-400 outline-none focus:border-indigo-500"
                    />
                    <span className="font-bold text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Ej: Transbank / Redelcom (2.5%). Se descontará automáticamente para calcular el ingreso real percibo por caja.
                  </span>
                </div>
              </div>

              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800 pb-2">
                  <Lock className="w-4 h-4" />
                  <span>Clave de Bloqueo de la Plataforma (Mín. 8 dígitos)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Nueva Clave de Seguridad Maestro
                  </label>
                  <input
                    type="password"
                    value={appPin}
                    onChange={(e) => {
                      setAppPin(e.target.value);
                      setWarningMsg('');
                    }}
                    placeholder="Mínimo 8 dígitos"
                    className="w-full bg-[#0d0d1a] border border-slate-800 rounded-xl p-2.5 font-mono text-slate-200 outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Requisito obligatorio: Al menos 8 caracteres o dígitos.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GESTIÓN DE USUARIOS Y CLAVES ASIGNADAS */}
          {activeTab === 'usuarios' && (
            <div className="space-y-4">
              <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2 text-indigo-400 font-bold">
                    <KeyRound className="w-4 h-4" />
                    Asignación de Claves de Acceso y Datos de Personal
                  </span>
                  <span className="text-[10px] text-slate-400">Cada operador requiere su PIN de acceso</span>
                </div>

                <div className="space-y-3">
                  {localUsers
                    .filter((u) => u.role !== 'cliente')
                    .map((usr) => (
                      <div key={usr.id} className="bg-[#050508] p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-200 block text-xs">{usr.name}</span>
                            <span className="text-[10px] text-indigo-400 capitalize font-mono">
                              Usuario: {usr.username} ({usr.role})
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                            Rol: {usr.role}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/60">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              🔑 Clave / PIN Asignado
                            </label>
                            <input
                              type="text"
                              value={usr.pin || ''}
                              onChange={(e) => handleUpdateUserPin(usr.id, e.target.value)}
                              placeholder="Ej: 1234"
                              className="w-full bg-[#0d0d1a] border border-slate-700 rounded-lg py-1 px-2 font-mono font-bold text-emerald-400 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              🪪 RUT del Trabajador
                            </label>
                            <input
                              type="text"
                              value={usr.rut || ''}
                              onChange={(e) => handleUpdateUserRut(usr.id, e.target.value)}
                              placeholder="12.345.678-9"
                              className="w-full bg-[#0d0d1a] border border-slate-700 rounded-lg py-1 px-2 font-mono text-slate-200 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              💵 Sueldo Base CLP (Nómina)
                            </label>
                            <input
                              type="number"
                              step="10000"
                              value={usr.baseSalary || ''}
                              onChange={(e) => handleUpdateUserBaseSalary(usr.id, parseFloat(e.target.value) || 0)}
                              placeholder="500000"
                              className="w-full bg-[#0d0d1a] border border-slate-700 rounded-lg py-1 px-2 font-mono font-bold text-amber-400 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
