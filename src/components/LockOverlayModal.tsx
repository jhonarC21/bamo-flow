import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface LockOverlayModalProps {
  isLocked: boolean;
  correctPin: string; // Min 8 digits
  appTitle: string;
  logoUrl?: string;
  onUnlock: () => void;
}

export const LockOverlayModal: React.FC<LockOverlayModalProps> = ({
  isLocked,
  correctPin,
  appTitle,
  logoUrl,
  onUnlock,
}) => {
  if (!isLocked) return null;

  const [enteredPin, setEnteredPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.length < 8) {
      setErrorMsg('La clave de acceso debe tener al menos 8 dígitos.');
      return;
    }

    if (enteredPin === correctPin) {
      setErrorMsg('');
      setEnteredPin('');
      onUnlock();
    } else {
      setErrorMsg('Clave incorrecta. Por favor verifique sus credenciales.');
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0d0d1a] border border-indigo-500/30 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
        
        {/* Glow decorative effect */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon / Logo */}
        <div className="flex flex-col items-center justify-center space-y-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain max-w-[200px]" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/50">
              <Lock className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
          )}
          <div>
            <h2 className="font-extrabold text-xl text-white tracking-tight">{appTitle || 'Plataforma Bloqueada'}</h2>
            <p className="text-xs text-slate-400 mt-1">Ingrese su clave de seguridad de 8 dígitos para acceder</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center justify-center gap-2 font-bold animate-shake">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clave de Acceso (Mínimo 8 dígitos)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                className="w-full bg-[#050508] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-widest text-indigo-200 outline-none transition-all"
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
            <p className="text-[10px] text-slate-500 mt-1 text-center">
              Clave predeterminada inicial: <code className="text-indigo-300 font-mono">12345678</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 cursor-pointer flex items-center justify-center gap-2 transition-all border border-indigo-400/30"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Desbloquear Plataforma</span>
          </button>
        </form>

      </div>
    </div>
  );
};
