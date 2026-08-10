import React, { useState } from 'react';
import { ActiveVehicle, Booking, CarWashService, ClientReview, ClientUser } from '../types';
import { formatCurrency, formatDuration, formatTimeOnly } from '../utils/pricing';
import {
  User,
  Mail,
  Lock,
  Calendar,
  Clock,
  Car,
  CheckCircle,
  Sparkles,
  Star,
  ShieldCheck,
  LogOut,
  QrCode,
  Send,
  Plus,
  AlertCircle,
  Key,
} from 'lucide-react';

interface ClientPortalSectionProps {
  currentUser: ClientUser | null;
  activeVehicles: ActiveVehicle[];
  washServices: CarWashService[];
  bookings: Booking[];
  reviews: ClientReview[];
  onLoginEmail: (email: string, pass: string) => void;
  onRegisterEmail: (email: string, name: string, pass: string, phone: string) => { requiresVerification: boolean };
  onVerifyEmailCode: (code: string) => boolean;
  onLoginGoogle: (googleAccountEmail: string) => void;
  onLogout: () => void;
  onAddClientBooking: (bookingData: Omit<Booking, 'id'>) => void;
  onAddReview: (review: Omit<ClientReview, 'id' | 'createdAt'>) => void;
}

export const ClientPortalSection: React.FC<ClientPortalSectionProps> = ({
  currentUser,
  activeVehicles,
  washServices,
  bookings,
  reviews,
  onLoginEmail,
  onRegisterEmail,
  onVerifyEmailCode,
  onLoginGoogle,
  onLogout,
  onAddClientBooking,
  onAddReview,
}) => {
  // Auth Form Modes
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify_email'>('login');
  
  // Auth Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Email Verification Step state
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // Google Modal Mock
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Sub-category navigation inside portal
  const [activePortalSubTab, setActivePortalSubTab] = useState<'agendar' | 'mis_vehiculos' | 'reservas_resenas'>('agendar');

  // Booking Form state
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState<string>('10:00');
  const [bookingServiceType, setBookingServiceType] = useState<'estacionamiento' | 'lavado' | 'ambos'>('ambos');
  const [selectedWashServiceId, setSelectedWashServiceId] = useState<string>(washServices[1]?.id || 'w2');
  const [bookingPlate, setBookingPlate] = useState<string>(currentUser?.registeredPlates[0] || 'KDJF-84');
  const [bookingName, setBookingName] = useState<string>(currentUser?.name || '');
  const [bookingPhone, setBookingPhone] = useState<string>(currentUser?.phone || '+569 8765 4321');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState(false);

  // Review Form state
  const [reviewPlate, setReviewPlate] = useState('KDJF-84');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  // Handlers for Auth
  const handlePerformLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginEmail(loginEmail, loginPass);
  };

  const handlePerformRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onRegisterEmail(regEmail, regName, regPass, regPhone);
    if (result.requiresVerification) {
      setAuthMode('verify_email');
    }
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onVerifyEmailCode(verificationCode);
    if (!success) {
      setVerificationError('Código de verificación incorrecto. Intente con "123456"');
    }
  };

  const handleSelectGoogleAccount = (email: string) => {
    onLoginGoogle(email);
    setIsGoogleModalOpen(false);
  };

  // Handler for Client Booking Submission
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClientBooking({
      clientName: bookingName || currentUser?.name || 'Cliente Web',
      clientPhone: bookingPhone || currentUser?.phone || '+569 9999 9999',
      plate: bookingPlate.toUpperCase().trim(),
      date: bookingDate,
      timeSlot: bookingTime,
      serviceType: bookingServiceType,
      washServiceId: bookingServiceType !== 'estacionamiento' ? selectedWashServiceId : undefined,
      status: 'pendiente', // Request goes into pending queue!
      notes: bookingNotes ? `[Portal Cliente] ${bookingNotes}` : '[Portal Cliente] Agendado desde la Web',
    });

    setBookingSuccessMsg(true);
    setBookingNotes('');
    setTimeout(() => setBookingSuccessMsg(false), 5000);
  };

  // Handler for Review Submission
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    onAddReview({
      clientEmail: currentUser.email,
      clientName: currentUser.name,
      plate: reviewPlate.toUpperCase().trim(),
      rating: reviewRating,
      comment: reviewComment,
    });
    setReviewComment('');
    setReviewSuccessMsg(true);
    setTimeout(() => setReviewSuccessMsg(false), 4000);
  };

  // Find user's active vehicles currently in parking lot
  const userActiveVehicles = activeVehicles.filter(
    (v) => currentUser?.registeredPlates.includes(v.plate.toUpperCase()) || v.driverName?.toLowerCase() === currentUser?.name.toLowerCase()
  );

  return (
    <div className="space-y-6">
      
      {/* CASE 1: NOT LOGGED IN -> Show Auth Forms (Email/Password + Verification or Gmail) */}
      {!currentUser ? (
        <div className="max-w-md mx-auto bg-[#0d0d1a] rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6 my-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-100">Portal del Cliente AutoPark</h2>
            <p className="text-xs text-slate-400">
              Inicie sesión o regístrese para agendar horas de atención y revisar el estado de su vehículo
            </p>
          </div>

          {/* Auth Mode Toggle */}
          {authMode !== 'verify_email' && (
            <div className="grid grid-cols-2 gap-2 bg-[#050508] p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  authMode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  authMode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Registrarse
              </button>
            </div>
          )}

          {/* GOOGLE / GMAIL LOGIN BUTTON */}
          {authMode !== 'verify_email' && (
            <div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-3 cursor-pointer shadow-md transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar con Google / Gmail</span>
              </button>

              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="shrink mx-3 text-[10px] text-slate-500 font-bold uppercase">o con correo</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
            </div>
          )}

          {/* FORM 1: LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handlePerformLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full bg-[#050508] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050508] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-lg shadow-indigo-950/50"
              >
                Ingresar al Portal
              </button>
            </form>
          )}

          {/* FORM 2: REGISTER */}
          {authMode === 'register' && (
            <form onSubmit={handlePerformRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Carlos Mendoza"
                  className="w-full bg-[#050508] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="carlos@ejemplo.com"
                  className="w-full bg-[#050508] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+569 8765 4321"
                    className="w-full bg-[#050508] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050508] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-lg shadow-indigo-950/50"
              >
                Registrar y Validar Correo
              </button>
            </form>
          )}

          {/* FORM 3: EMAIL VERIFICATION STEP */}
          {authMode === 'verify_email' && (
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4 text-xs">
              <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-500/30 text-center space-y-2">
                <Mail className="w-8 h-8 text-indigo-400 mx-auto" />
                <h3 className="font-bold text-slate-100 text-sm">Validación de Correo Electrónico</h3>
                <p className="text-slate-300 text-[11px]">
                  Hemos enviado un código de verificación de 6 dígitos a <strong className="text-indigo-300">{regEmail || 'su correo'}</strong>.
                </p>
                <div className="bg-black/40 p-2 rounded-xl border border-slate-800 font-mono text-indigo-400 font-bold text-xs">
                  Código de prueba rápida: 123456
                </div>
              </div>

              {verificationError && (
                <div className="p-2.5 bg-red-950 text-red-300 rounded-xl border border-red-500/30 text-center text-[11px] font-bold">
                  {verificationError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1 text-center">Ingrese el Código de 6 Dígitos</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    setVerificationError('');
                  }}
                  placeholder="123456"
                  className="w-full bg-[#050508] border border-slate-800 rounded-xl p-3 text-center text-xl font-mono tracking-widest font-black text-indigo-300 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                Validar Correo e Ingresar
              </button>
            </form>
          )}

        </div>
      ) : (
        /* CASE 2: LOGGED IN CLIENT DASHBOARD WITH SUBCATEGORIES */
        <div className="space-y-6">
          
          {/* User Header Profile Card */}
          <div className="bg-[#0d0d1a] p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg text-slate-100">{currentUser.name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Correo Verificado
                  </span>
                </div>
                <p className="text-xs text-slate-400">{currentUser.email} • {currentUser.authProvider === 'google' ? 'Google Auth' : 'Email/Clave'}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer flex items-center gap-1.5 self-start sm:self-auto border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Sub-Category Navigation Tabs inside Portal */}
          <div className="bg-[#0d0d1a] p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setActivePortalSubTab('agendar')}
              className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePortalSubTab === 'agendar'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>📅 Agendar Hora de Atención</span>
            </button>

            <button
              onClick={() => setActivePortalSubTab('mis_vehiculos')}
              className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePortalSubTab === 'mis_vehiculos'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>🚘 Mis Vehículos en Vivo ({userActiveVehicles.length})</span>
            </button>

            <button
              onClick={() => setActivePortalSubTab('reservas_resenas')}
              className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePortalSubTab === 'reservas_resenas'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Star className="w-4 h-4 text-amber-300" />
              <span>📜 Mis Reservas & Opinar</span>
            </button>
          </div>

          {/* SUBCATEGORY 1: AGENDAR HORA DE ATENCIÓN */}
          {activePortalSubTab === 'agendar' && (
            <div className="bg-[#0d0d1a] rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <span>Reserva y Agendamiento de Hora de Atención</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Seleccione la fecha, hora y servicio deseado. Su solicitud ingresará en la agenda en estado <strong>Pendiente</strong> a la espera de confirmación.
                </p>
              </div>

              {bookingSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs space-y-1 font-bold animate-fadeIn">
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>¡Solicitud de Reserva Enviada Exitosamente!</span>
                  </div>
                  <p>
                    Su reserva para la patente <strong className="text-white font-mono">{bookingPlate}</strong> para el {bookingDate} a las {bookingTime} hrs ha quedado registrada como <strong>Pendiente de Aprobación</strong>.
                  </p>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Patente del Vehículo *</label>
                    <input
                      type="text"
                      value={bookingPlate}
                      onChange={(e) => setBookingPlate(e.target.value.toUpperCase())}
                      placeholder="Ej: AB-1234"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-3 font-mono font-bold text-base text-indigo-300 uppercase outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nombre Solicitante *</label>
                    <input
                      type="text"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      placeholder="Su nombre"
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-3 font-bold text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Fecha Preferida *</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Bloque Horario Disponible *</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="09:00">09:00 hrs (Mañana)</option>
                      <option value="10:30">10:30 hrs (Mañana)</option>
                      <option value="12:00">12:00 hrs (Mediodía)</option>
                      <option value="14:30">14:30 hrs (Tarde)</option>
                      <option value="16:00">16:00 hrs (Tarde)</option>
                      <option value="18:00">18:00 hrs (Vespertino)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-300">Tipo de Atención Requerida *</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingServiceType('estacionamiento')}
                      className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        bookingServiceType === 'estacionamiento'
                          ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-[#050508] text-slate-400'
                      }`}
                    >
                      <div className="font-extrabold text-xs mb-1">🚗 Solo Estacionamiento</div>
                      <div className="text-[10px] text-slate-400">Reserva de cupo en patio</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingServiceType('lavado')}
                      className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        bookingServiceType === 'lavado'
                          ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-[#050508] text-slate-400'
                      }`}
                    >
                      <div className="font-extrabold text-xs mb-1">🧼 Servicio de Lavado</div>
                      <div className="text-[10px] text-slate-400">Atención de lavado o detailing</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingServiceType('ambos')}
                      className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        bookingServiceType === 'ambos'
                          ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-[#050508] text-slate-400'
                      }`}
                    >
                      <div className="font-extrabold text-xs mb-1">✨ Estacionamiento + Lavado</div>
                      <div className="text-[10px] text-slate-400">Servicio combinado preferencial</div>
                    </button>
                  </div>
                </div>

                {/* Wash service selection if applicable */}
                {bookingServiceType !== 'estacionamiento' && (
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Seleccione el Tipo de Lavado</label>
                    <select
                      value={selectedWashServiceId}
                      onChange={(e) => setSelectedWashServiceId(e.target.value)}
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-bold text-slate-200 outline-none focus:border-indigo-500"
                    >
                      {washServices.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name} — {formatCurrency(ws.price)} ({ws.durationMinutes} min)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Notas o Indicaciones Especiales</label>
                  <input
                    type="text"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Ej: Solicito encerado especial o desinfección de asientos"
                    className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm cursor-pointer shadow-xl shadow-indigo-950/60 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirmar y Enviar Solicitud de Agendamiento</span>
                </button>

              </form>
            </div>
          )}

          {/* SUBCATEGORY 2: MIS VEHÍCULOS EN VIVO */}
          {activePortalSubTab === 'mis_vehiculos' && (
            <div className="bg-[#0d0d1a] rounded-3xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Car className="w-5 h-5 text-indigo-400" />
                <span>Estado de sus Vehículos Estacionados</span>
              </h3>

              {userActiveVehicles.length === 0 ? (
                <div className="text-center py-10 bg-[#050508] rounded-2xl border border-slate-800 space-y-2">
                  <Car className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="font-bold text-slate-300 text-sm">No tiene vehículos estacionados en este momento</h4>
                  <p className="text-xs text-slate-400">Cuando ingrese su vehículo al recinto, aparecerá aquí su estado en tiempo real.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userActiveVehicles.map((v) => (
                    <div key={v.id} className="bg-[#050508] p-5 rounded-2xl border border-indigo-500/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xl font-black text-indigo-300 bg-indigo-950 px-3 py-1 rounded-xl border border-indigo-500/30">
                          {v.plate}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                          ESTACIONADO (Espacio {v.spotId})
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Hora de Ingreso:</span>
                          <span className="font-mono text-slate-200">{formatTimeOnly(v.entryTime)}</span>
                        </div>
                        {v.attachedWashService && (
                          <div className="flex justify-between text-indigo-300 font-bold">
                            <span>Estado Lavado:</span>
                            <span className="capitalize">{v.attachedWashService.status} ({v.attachedWashService.serviceName})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBCATEGORY 3: MIS RESERVAS & DEJAR RESEÑA */}
          {activePortalSubTab === 'reservas_resenas' && (
            <div className="space-y-6">
              
              {/* Reviews Form */}
              <div className="bg-[#0d0d1a] rounded-3xl border border-slate-800 p-6 space-y-4">
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Dejar una Reseña / Calificación del Servicio</span>
                </h3>

                {reviewSuccessMsg && (
                  <div className="p-3 bg-emerald-950 text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>¡Muchas gracias! Su reseña ha sido enviada al equipo del recinto.</span>
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Patente Atendida</label>
                      <input
                        type="text"
                        value={reviewPlate}
                        onChange={(e) => setReviewPlate(e.target.value.toUpperCase())}
                        placeholder="Ej: AB-1234"
                        className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 font-mono text-indigo-300 uppercase font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Calificación (1 a 5 Estrellas)</label>
                      <div className="flex items-center space-x-1 pt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Comentario o Sugerencia</label>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Escriba su opinión sobre el estacionamiento o lavado..."
                      className="w-full bg-[#050508] border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer shadow-md"
                  >
                    Enviar Opinión
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      )}

      {/* GOOGLE OAUTH SIMULATION MODAL */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="font-bold text-sm">Iniciar Sesión con Google</span>
              </div>
              <button onClick={() => setIsGoogleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Seleccione la cuenta de Google con la que desea ingresar a AutoPark:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSelectGoogleAccount('winpi1992@gmail.com')}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left flex items-center space-x-3 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  W
                </div>
                <div>
                  <div className="font-bold text-xs">Winpi User</div>
                  <div className="text-[11px] text-slate-500">winpi1992@gmail.com</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectGoogleAccount('carlos.mendoza@gmail.com')}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left flex items-center space-x-3 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  C
                </div>
                <div>
                  <div className="font-bold text-xs">Carlos Mendoza (VIP)</div>
                  <div className="text-[11px] text-slate-500">carlos.mendoza@email.com</div>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
