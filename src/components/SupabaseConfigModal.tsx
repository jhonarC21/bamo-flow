import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Key,
  Globe,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  FileCode,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  getSupabaseClient,
  SUPABASE_SQL_SCHEMA
} from '../lib/supabase';
import { Transaction, Expense, AccountingEntry, ActiveVehicle } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  expenses: Expense[];
  accountingEntries: AccountingEntry[];
  activeVehicles: ActiveVehicle[];
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  transactions,
  expenses,
  accountingEntries,
  activeVehicles,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [anonKeyInput, setAnonKeyInput] = useState<string>('');
  const [isFromEnv, setIsFromEnv] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({ tested: false, success: false, message: '' });

  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrlInput(creds.url);
      setAnonKeyInput(creds.anonKey);
      setIsFromEnv(creds.isFromEnv);

      if (creds.url && creds.anonKey) {
        handleTestConnection();
      } else {
        setConnectionStatus({ tested: false, success: false, message: '' });
      }
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus({ tested: false, success: false, message: 'Probando conexión...' });
    
    // Temporarily save to test if user edited fields
    if (urlInput && anonKeyInput) {
      saveSupabaseCredentials(urlInput, anonKeyInput);
    }

    const res = await testSupabaseConnection();
    setTesting(false);
    setConnectionStatus({
      tested: true,
      success: res.success,
      message: res.message,
    });
  };

  const handleSaveAndConnect = async () => {
    saveSupabaseCredentials(urlInput, anonKeyInput);
    await handleTestConnection();
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setUrlInput('');
    setAnonKeyInput('');
    setConnectionStatus({
      tested: true,
      success: false,
      message: 'Se han eliminado las credenciales locales de Supabase.',
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Push local state to Supabase
  const handleSyncLocalToSupabase = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      alert('Debe configurar y verificar la conexión a Supabase primero.');
      return;
    }

    setSyncing(true);
    setSyncResult('Iniciando sincronización a la base de datos Supabase...');

    try {
      let logMsgs: string[] = [];

      // 1. Sync Active Vehicles
      if (activeVehicles.length > 0) {
        const mappedVehicles = activeVehicles.map((v) => ({
          id: v.id,
          plate: v.plate,
          vehicle_type: v.vehicleType,
          make: v.make || null,
          model: v.model || null,
          color: v.color || null,
          spot_id: v.spotId || null,
          entry_time: v.entryTime,
          charging_mode: v.chargingMode || null,
          hourly_rate: v.hourlyRate || 0,
          is_covenant: v.isCovenant || false,
          covenant_name: v.covenantName || null,
          driver_name: v.driverName || null,
          driver_phone: v.driverPhone || null,
          store_items: v.storeItems || [],
          wash_order_ids: v.washOrderIds || [],
        }));

        const { error } = await supabase.from('active_vehicles').upsert(mappedVehicles);
        if (error) {
          logMsgs.push(`⚠️ Error en active_vehicles: ${error.message}`);
        } else {
          logMsgs.push(`✅ ${activeVehicles.length} vehículos en patio sincronizados.`);
        }
      }

      // 2. Sync Transactions
      if (transactions.length > 0) {
        const mappedTx = transactions.map((t) => ({
          id: t.id,
          ticket_number: t.ticketNumber || null,
          boleta_number: t.boletaNumber || null,
          date: t.date,
          type: t.type,
          plate: t.plate || null,
          vehicle_type: t.vehicleType || null,
          entry_time: t.entryTime || null,
          exit_time: t.exitTime || null,
          elapsed_minutes: t.elapsedMinutes || 0,
          parking_fee: t.parkingFee || 0,
          wash_fee: t.washFee || 0,
          store_fee: t.storeFee || 0,
          net_total: t.netTotal || 0,
          vat_amount: t.vatAmount || 0,
          total: t.total || 0,
          payment_method: t.paymentMethod,
          item_details: t.itemDetails || [],
        }));

        const { error } = await supabase.from('transactions').upsert(mappedTx);
        if (error) {
          logMsgs.push(`⚠️ Error en transactions: ${error.message}`);
        } else {
          logMsgs.push(`✅ ${transactions.length} transacciones sincronizadas.`);
        }
      }

      // 3. Sync Expenses
      if (expenses.length > 0) {
        const mappedExpenses = expenses.map((e) => ({
          id: e.id,
          date: e.date,
          category: e.category,
          category_label: e.categoryLabel,
          description: e.description,
          amount: e.amount,
          payment_method: e.paymentMethod,
        }));

        const { error } = await supabase.from('expenses').upsert(mappedExpenses);
        if (error) {
          logMsgs.push(`⚠️ Error en expenses: ${error.message}`);
        } else {
          logMsgs.push(`✅ ${expenses.length} gastos operacionales sincronizados.`);
        }
      }

      // 4. Sync Accounting Entries
      if (accountingEntries.length > 0) {
        const mappedEntries = accountingEntries.map((a) => ({
          id: a.id,
          entry_number: a.entryNumber,
          date: a.date,
          concept: a.concept,
          lines: a.lines,
          total_debe: a.totalDebe,
          total_haber: a.totalHaber,
          source_type: a.sourceType,
          reference_id: a.referenceId || null,
        }));

        const { error } = await supabase.from('accounting_entries').upsert(mappedEntries);
        if (error) {
          logMsgs.push(`⚠️ Error en accounting_entries: ${error.message}`);
        } else {
          logMsgs.push(`✅ ${accountingEntries.length} asientos contables sincronizados.`);
        }
      }

      setSyncResult(logMsgs.join('\n'));
    } catch (err: any) {
      setSyncResult(`❌ Error de sincronización: ${err.message || String(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a0a12] rounded-3xl border border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#111122] p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Conexión a Base de Datos Supabase (PostgreSQL)</h3>
              <p className="text-[11px] text-slate-400">Integración de persistencia remota en la nube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Status Indicator */}
          <div
            className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all ${
              connectionStatus.tested && connectionStatus.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : connectionStatus.tested && !connectionStatus.success
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}
          >
            {connectionStatus.tested ? (
              connectionStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1 flex-1">
              <span className="font-extrabold block">
                {connectionStatus.tested
                  ? connectionStatus.success
                    ? 'Conectado a Supabase'
                    : 'Error de Conexión'
                  : 'Estado de la Conexión'}
              </span>
              <p className="text-[11px] opacity-90">
                {connectionStatus.message ||
                  'Ingrese su URL de proyecto Supabase y la Anon Public Key para habilitar la sincronización remota.'}
              </p>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3 bg-[#111122] p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Supabase Project URL
                </span>
                {isFromEnv && (
                  <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950 px-1.5 py-0.5 rounded">
                    Desde .env
                  </span>
                )}
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-[#080810] border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-slate-200 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Supabase Anon Key (API Key pública)
                </span>
              </label>
              <input
                type="password"
                value={anonKeyInput}
                onChange={(e) => setAnonKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-[#080810] border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-slate-200 outline-hidden font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] text-slate-400 hover:text-rose-400 font-bold cursor-pointer"
              >
                Limpiar Credenciales
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>Probar Conexión</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndConnect}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/80 cursor-pointer"
                >
                  Guardar y Conectar
                </button>
              </div>
            </div>
          </div>

          {/* Sync Local Data Section */}
          <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  Sincronizar Datos Locales a Supabase
                </h4>
                <p className="text-[11px] text-slate-400">
                  Transfiere las {transactions.length} ventas, {expenses.length} gastos y {accountingEntries.length} asientos contables a la base de datos remota.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncLocalToSupabase}
                disabled={syncing || !connectionStatus.success}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Subir Datos a Supabase</span>
              </button>
            </div>

            {syncResult && (
              <pre className="bg-[#080810] p-3 rounded-xl border border-slate-800 text-[10px] text-emerald-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                {syncResult}
              </pre>
            )}
          </div>

          {/* SQL Setup Script Box */}
          <div className="bg-[#111122] p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Script de Tablas SQL para Supabase</span>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Si es la primera vez que te conectas, abre el panel de tu proyecto en Supabase, ve a{' '}
              <strong className="text-indigo-300">SQL Editor</strong>, pega el siguiente código y haz clic en{' '}
              <strong className="text-emerald-300">RUN</strong>:
            </p>

            <pre className="bg-[#080810] p-3 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-36">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#111122] p-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
