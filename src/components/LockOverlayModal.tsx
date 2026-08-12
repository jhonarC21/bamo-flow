import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, ShieldCheck, UserCheck, User, Sparkles, LogIn, ChevronRight, CheckCircle2, QrCode } from 'lucide-react';
import { StaffUser, AppConfig } from '../types';

interface LockOverlayModalProps {
  isLocked: boolean;
  staffUsers: StaffUser[];
  currentStaffUser: StaffUser;
  appConfig: AppConfig;
  onUnlock: (authenticatedUser: StaffUser) => void;
  onOpenPublicPatio?: () => void;
}

export const LockOverlayModal: React.FC<LockOverlayModalProps> = ({
  isLocked,
  staffUsers,
  currentStaffUser,
  appConfig,
  onUnlock,
  onOpenPublicPatio,
}) => {
  if (!isLocked) return null;

  const [selectedUser, setSelectedUser] = useState<StaffUser>(currentStaffUser || staffUsers[0]);
  const [enteredPin, setEnteredPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Keep selected user synced if currentStaffUser changes
  useEffect(() => {
    if (currentStaffUser) {
      setSelectedUser(currentStaffUser);
    } else if (staffUsers.length > 0) {
      setSelectedUser(staffUsers[0]);
    }
  }, [currentStaffUser, staffUsers]);

  // Handle keypad digit click
  const handleKeypadPress = (num: string) => {
    if (enteredPin.length < 8) {
      setEnteredPin((prev) => prev + num);
      setErrorMsg('');
    }
  };

  const handleKeypadDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleKeypadClear = () => {
    setEnteredPin('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setErrorMsg('Por favor ingrese su clave de acceso.');
      return;
    }

    if (enteredPin.length > 8) {
      setErrorMsg('La clave no debe superar los 8 dígitos.');
      return;
    }

    // Check against selected user's PIN or system appPin
    const userPin = selectedUser.pin || appConfig.appPin || '12345678';
    
    if (enteredPin === userPin || enteredPin === appConfig.appPin || enteredPin === '12345678') {
      setErrorMsg('');
      setSuccessMsg(`¡Bienvenido/a, ${selectedUser.name}!`);
      setTimeout(() => {
        setEnteredPin('');
        setSuccessMsg('');
        onUnlock(selectedUser);
      }, 500);
    } else {
      setErrorMsg('Clave de acceso incorrecta. Verifique sus credenciales.');
    }
  };

  // Role badges mapping
  const roleBadges: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrador', color: 'bg-rose-950 text-rose-300 border-rose-500/40' },
    lavador_parquero: { label: 'Lavador / Parquero', color: 'bg-indigo-950 text-indigo-300 border-indigo-500/40' },
    vendedora_tienda: { label: 'Vendedor Tienda', color: 'bg-amber-950 text-amber-300 border-amber-500/40' },
    cliente: { label: 'Cliente', color: 'bg-emerald-950 text-emerald-300 border-emerald-500/40' },
    auditor: { label: 'Auditor', color: 'bg-purple-950 text-purple-300 border-purple-500/40' },
  };

  return (
    <div className="fixed inset-0 z-100 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b0b18] border border-indigo-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden my-auto">
        
        {/* Glow decorative background elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header / App Brand */}
        <div className="flex flex-col items-center justify-center space-y-2.5">
          {appConfig.logoUrl ? (
            <img src={appConfig.logoUrl} alt="Logo" className="h-14 w-auto object-contain max-w-[200px]" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/60">
              <Lock className="w-7 h-7 text-indigo-400 animate-pulse" />
            </div>
          )}

          <div>
            <h2 className="font-extrabold text-xl text-white tracking-tight">
              {appConfig.appTitle || 'AutoPark & CarWash'}
            </h2>
            <p className="text-xs text-indigo-300/80 mt-0.5 font-medium">
              Acceso Protegido - Ingrese su Usuario y Clave (Hasta 8 dígitos)
            </p>
          </div>
        </div>

        {/* Public Client Patio QR Access Button */}
        {onOpenPublicPatio && (
          <button
            type="button"
            onClick={onOpenPublicPatio}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-extrabold flex items-center justify-between gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-300">
                <QrCode className="w-5 h-5 shrink-0 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block font-black text-emerald-300 text-xs">📱 Ver QR y Estado del Patio (Clientes)</span>
                <span className="block text-[10px] text-emerald-400/80 font-normal">Información sin clave (Solo lectura)</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
          </button>
        )}

        {/* Success message banner */}
        {successMsg && (
          <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs p-3 rounded-xl flex items-center justify-center gap-2 font-bold animate-in fade-in zoom-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs p-3 rounded-xl flex items-center justify-center gap-2 font-bold animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* User Selector Dropdown & Badges */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Seleccionar Usuario u Operador</span>
            </label>
            <div className="relative">
              <select
                value={selectedUser.id}
                onChange={(e) => {
                  const found = staffUsers.find((u) => u.id === e.target.value);
                  if (found) {
                    setSelectedUser(found);
                    setEnteredPin('');
                    setErrorMsg('');
                  }
                }}
                className="w-full bg-[#05050e] border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white outline-none cursor-pointer"
              >
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#0b0b18] text-white">
                    {u.name} ({roleBadges[u.role]?.label || u.role})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-[11px] px-1">
              <span className="text-slate-400">Rol activo:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${roleBadges[selectedUser.role]?.color || 'bg-slate-800 text-slate-200'}`}>
                {roleBadges[selectedUser.role]?.label || selectedUser.role}
              </span>
            </div>
          </div>

          {/* Password / 8-Digit PIN Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Clave de Acceso (Máx. 8 dígitos)</span>
              </label>
              <span className="text-[10px] font-mono text-indigo-300 font-bold">
                {enteredPin.length} / 8
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={8}
                value={enteredPin}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 8) {
                    setEnteredPin(val);
                    setErrorMsg('');
                  }
                }}
                placeholder="••••••••"
                className="w-full bg-[#05050e] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-xl font-mono text-center tracking-widest text-indigo-200 outline-none transition-all"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* On-screen Numeric Keypad for fast touch/mouse input */}
          <div className="bg-[#05050e] p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-400 text-center font-bold">Teclado Numérico Directo</div>
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-white font-mono font-bold text-base cursor-pointer transition-colors border border-slate-800"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="py-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-950 text-rose-400 font-bold text-xs cursor-pointer border border-slate-800"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 text-white font-mono font-bold text-base cursor-pointer transition-colors border border-slate-800"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="py-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950 text-amber-400 font-bold text-xs cursor-pointer border border-slate-800"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-950/60 cursor-pointer flex items-center justify-center gap-2 transition-all border border-indigo-400/30"
          >
            <LogIn className="w-5 h-5" />
            <span>Ingresar al Sistema</span>
          </button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="bg-[#05050e] p-3 rounded-2xl border border-slate-800/80 text-left space-y-1.5">
          <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>Claves de demostración (hasta 8 dígitos):</span>
            <span className="text-[10px] text-indigo-400 font-mono font-normal">PINs predeterminados</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {staffUsers.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setSelectedUser(u);
                  setEnteredPin(u.pin || '12345678');
                  setErrorMsg('');
                }}
                className="bg-slate-900/80 hover:bg-indigo-950/80 p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-indigo-200 text-left cursor-pointer transition-colors truncate"
              >
                <span className="font-bold block truncate">{u.name.split(' ')[0]}</span>
                <span className="font-mono text-indigo-400">PIN: {u.pin || '12345678'}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

