import React, { useState } from 'react';
import { Car, Clock, DollarSign, PlusCircle, Settings, ShieldAlert, Sparkles, RefreshCw, UserCheck, Shield, ShoppingBag, CarFront, User, Lock, KeyRound, X, Database } from 'lucide-react';
import { RateConfig, StaffUser, UserRole, AppConfig } from '../types';
import { formatCurrency } from '../utils/pricing';
import { initialStaffUsers } from '../data/initialData';

interface HeaderProps {
  activeCount: number;
  totalSpots: number;
  todayIncome: number;
  config: RateConfig;
  appConfig?: AppConfig;
  currentUser?: StaffUser;
  staffUsers?: StaffUser[];
  onSwitchUser?: (user: StaffUser) => void;
  onOpenNewEntry: () => void;
  onOpenSettings: () => void;
  onOpenSupabase?: () => void;
  onLockPlatform?: () => void;
  currentTime: Date;
}

const roleBadges: Record<UserRole, { label: string; icon: any; color: string; border: string }> = {
  admin: { label: 'Administrador', icon: Shield, color: 'bg-indigo-950 text-indigo-300', border: 'border-indigo-500/50' },
  lavador_parquero: { label: 'Parquero / Lavador', icon: CarFront, color: 'bg-cyan-950 text-cyan-300', border: 'border-cyan-500/50' },
  vendedora_tienda: { label: 'Vendedora Tienda', icon: ShoppingBag, color: 'bg-emerald-950 text-emerald-300', border: 'border-emerald-500/50' },
  cliente: { label: 'Portal Cliente', icon: User, color: 'bg-amber-950 text-amber-300', border: 'border-amber-500/50' },
};

export const Header: React.FC<HeaderProps> = ({
  activeCount,
  totalSpots,
  todayIncome,
  config,
  appConfig,
  currentUser,
  staffUsers = initialStaffUsers,
  onSwitchUser,
  onOpenNewEntry,
  onOpenSettings,
  onOpenSupabase,
  onLockPlatform,
  currentTime,
}) => {
  const activeUser = currentUser || staffUsers[0] || { id: 'usr-1', username: 'admin', name: 'Administrador General', role: 'admin' };
  const occupancyPercentage = Math.round((activeCount / totalSpots) * 100) || 0;
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // User PIN Switching Auth State
  const [pendingUser, setPendingUser] = useState<StaffUser | null>(null);
  const [userPinInput, setUserPinInput] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  const RoleIcon = roleBadges[activeUser.role]?.icon || User;

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 600);
  };

  const handleInitiateSwitchUser = (targetUser: StaffUser) => {
    if (targetUser.id === activeUser.id) {
      setShowRoleSelector(false);
      return;
    }
    // If target user is client portal or doesn't have PIN, switch immediately
    if (targetUser.role === 'cliente' || !targetUser.pin) {
      if (onSwitchUser) onSwitchUser(targetUser);
      setShowRoleSelector(false);
      return;
    }
    // Otherwise require PIN
    setPendingUser(targetUser);
    setUserPinInput('');
    setPinErrorMsg('');
    setShowRoleSelector(false);
  };

  const handleConfirmPinSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    const expectedPin = pendingUser.pin || appConfig?.appPin || '12345678';
    if (userPinInput.trim() === expectedPin || userPinInput.trim() === appConfig?.appPin) {
      if (onSwitchUser) onSwitchUser(pendingUser);
      setPendingUser(null);
      setUserPinInput('');
      setPinErrorMsg('');
    } else {
      setPinErrorMsg('Clave de acceso incorrecta. Intente nuevamente.');
    }
  };

  return (
    <header className="bg-[#0a0a12] text-slate-200 border-b border-slate-800/60 sticky top-0 z-30 shadow-xl shadow-indigo-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            {appConfig?.logoUrl ? (
              <img src={appConfig.logoUrl} alt="Logo" className="h-11 w-auto max-w-[140px] object-contain rounded-xl" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30 shrink-0">
                <Car className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <h1 className="font-bold text-xl text-white tracking-tight">
                  {appConfig?.appTitle || 'Gestión Central Estacionamiento'}
                </h1>
                
                {/* Realtime Sync Status Indicator */}
                <button
                  onClick={handleManualSync}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  title="Sincronización en línea activa con Firebase Firestore"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  <span>ONLINE REALTIME</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-slate-400 font-medium">
                  Modo: <strong className="text-slate-200 capitalize">
                    {config.mode === 'tramo'
                      ? `Tramos (1º ${config.firstBlockMinutes}m + 10m)`
                      : config.mode === 'nocturno'
                      ? `Arriendo Nocturno ($${config.nightlyRate.toLocaleString()}/noche)`
                      : 'Por Minuto Directo'}
                  </strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 font-mono text-indigo-300">
                  <Clock className="w-3 h-3 text-indigo-400" /> {currentTime.toLocaleTimeString('es-ES')}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Stats & Role Switcher */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-1">
            
            {/* Occupancy Indicator */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${occupancyPercentage > 85 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${occupancyPercentage > 85 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </div>
              <div>
                <span className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Capacidad</span>
                <span className="text-sm font-mono font-bold text-indigo-200">{activeCount} / {totalSpots} <span className="text-slate-400 text-[11px] font-normal">({occupancyPercentage}%)</span></span>
              </div>
            </div>

            {/* Daily Income (Only if allowed) */}
            {activeUser.role !== 'cliente' && (
              <div className="bg-[#0d0d1a] border border-slate-800/60 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Ingresos Hoy</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(todayIncome)}</span>
                </div>
              </div>
            )}

            {/* User Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${roleBadges[activeUser.role]?.color} ${roleBadges[activeUser.role]?.border}`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px] sm:max-w-none">{activeUser.name}</span>
                <UserCheck className="w-3 h-3 opacity-60 ml-0.5" />
              </button>

              {showRoleSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0d0d1a] border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 border-b border-slate-800">
                    Cambiar Perfil / Rol de Usuario
                  </div>
                  {staffUsers.map((user) => {
                    const BadgeIcon = roleBadges[user.role]?.icon || User;
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleInitiateSwitchUser(user)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          activeUser.id === user.id
                            ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BadgeIcon className="w-4 h-4 text-indigo-400" />
                          <div>
                            <div className="font-bold">{user.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{roleBadges[user.role]?.label}</div>
                          </div>
                        </div>
                        {activeUser.id === user.id && <span className="text-[10px] text-emerald-400 font-bold">ACTIVO</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
              {activeUser.role !== 'cliente' && (
                <button
                  onClick={onOpenNewEntry}
                  className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-900/50 cursor-pointer whitespace-nowrap border border-indigo-400/30"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Entrada</span>
                </button>
              )}

              {activeUser.role === 'admin' && (
                <>
                  {onLockPlatform && (
                    <button
                      onClick={onLockPlatform}
                      className="p-2 text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-xl transition-colors cursor-pointer"
                      title="Bloquear Plataforma (Clave de 8 dígitos)"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                  {onOpenSupabase && (
                    <button
                      onClick={onOpenSupabase}
                      className="p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl transition-colors cursor-pointer"
                      title="Conexión a Base de Datos Supabase (PostgreSQL)"
                    >
                      <Database className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onOpenSettings}
                    className="p-2 text-slate-400 hover:text-white bg-[#0d0d1a] hover:bg-slate-800/80 border border-slate-800/60 rounded-xl transition-colors cursor-pointer"
                    title="Configuración General, Impresora 58mm y Roles"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* USER PIN AUTHENTICATION MODAL */}
      {pendingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setPendingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Verificación de Clave de Usuario</h3>
                <p className="text-xs text-slate-400">Accediendo como <strong className="text-indigo-400 font-semibold">{pendingUser.name}</strong></p>
              </div>
            </div>

            <form onSubmit={handleConfirmPinSwitch} className="space-y-4">
              {pinErrorMsg && (
                <div className="bg-rose-950/80 text-rose-300 border border-rose-500/40 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pinErrorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Ingrese su Clave Secreta o PIN
                </label>
                <input
                  type="password"
                  value={userPinInput}
                  onChange={(e) => {
                    setUserPinInput(e.target.value);
                    setPinErrorMsg('');
                  }}
                  autoFocus
                  placeholder="••••••••"
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white outline-hidden focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ingrese el PIN asignado a su cuenta de operador para validar el cambio.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer"
                >
                  Ingresar y Validar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

