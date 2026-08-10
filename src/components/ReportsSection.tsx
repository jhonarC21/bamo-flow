import React, { useState } from 'react';
import { Expense, ExpenseCategory, Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';
import { CreditCard, DollarSign, FileText, Printer, Search, ShoppingBag, Sparkles, TrendingUp, ShieldCheck, CheckCircle2, Receipt, Plus, ArrowDownCircle, ArrowUpCircle, X, Wallet } from 'lucide-react';

interface ReportsSectionProps {
  transactions: Transaction[];
  expenses?: Expense[];
  onReprintTicket: (transaction: Transaction) => void;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'date'>) => void;
}

const expenseCategoryLabels: Record<ExpenseCategory, { label: string; icon: string }> = {
  agua: { label: 'Agua Potable', icon: '💧' },
  luz: { label: 'Energía Eléctrica (Luz)', icon: '⚡' },
  internet: { label: 'Internet / Telecom', icon: '🌐' },
  arriendo: { label: 'Arriendo de Local / Terreno', icon: '🏢' },
  contador: { label: 'Honorarios Contador', icon: '📊' },
  mercancia: { label: 'Compra de Mercadería / Insumos', icon: '📦' },
  sueldos: { label: 'Sueldos / Remuneraciones', icon: '👥' },
  mantenimiento: { label: 'Mantenimiento / Reparaciones', icon: '🛠️' },
  otro: { label: 'Otros Gastos Operacionales', icon: '📝' },
};

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  transactions,
  expenses = [],
  onReprintTicket,
  onAddExpense,
}) => {
  const [search, setSearch] = useState('');

  // Shift closing cash count input
  const [cashCounted, setCashCounted] = useState<string>('');
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [shiftClosed, setShiftClosed] = useState<boolean>(false);

  // Modal to add operational expense
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('agua');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<number>(15000);
  const [expPaymentMethod, setExpPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [expSupplier, setExpSupplier] = useState('');

  // Income Breakdown
  const totalIncome = transactions.reduce((sum, t) => sum + t.total, 0);
  const parkingIncome = transactions.reduce((sum, t) => sum + t.parkingFee, 0);
  const storeIncome = transactions.reduce((sum, t) => sum + t.storeFee, 0);
  const washIncome = transactions.reduce((sum, t) => sum + t.washFee, 0);

  // Expenses Breakdown
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // Payment Methods
  const efectivoTotal = transactions
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + t.total, 0);
  const tarjetaTotal = transactions
    .filter((t) => t.paymentMethod === 'tarjeta')
    .reduce((sum, t) => sum + t.total, 0);
  const transferenciaTotal = transactions
    .filter((t) => t.paymentMethod === 'transferencia')
    .reduce((sum, t) => sum + t.total, 0);

  // Expenses paid in cash
  const cashExpensesTotal = expenses
    .filter((e) => e.paymentMethod === 'efectivo')
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredTransactions = transactions.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      (t.plate && t.plate.toLowerCase().includes(q))
    );
  });

  const cashExpected = Math.max(0, efectivoTotal - cashExpensesTotal);
  const cashCountNum = parseFloat(cashCounted) || 0;
  const cashDifference = cashCountNum - cashExpected;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription.trim() || expAmount <= 0) return;

    if (onAddExpense) {
      onAddExpense({
        category: expCategory,
        description: expDescription.trim(),
        amount: expAmount,
        paymentMethod: expPaymentMethod,
        supplierOrRef: expSupplier.trim() || undefined,
        recordedBy: 'Administración',
      });
    }

    setIsAddExpenseOpen(false);
    setExpDescription('');
    setExpAmount(15000);
    setExpSupplier('');
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0a0a12] to-[#0d0d1a] text-white rounded-3xl p-6 border border-emerald-500/30 shadow-xl shadow-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Reporte Financiero, Gastos Operativos & Cierre de Caja</h2>
            <p className="text-xs text-slate-400">Balance contable consolidado: Ingresos, gastos fijos/variables y arqueo de caja.</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Ingresos Brut:</span>
            <span className="text-xl font-mono font-black text-emerald-400">{formatCurrency(totalIncome)}</span>
          </div>

          <div className="text-right border-l border-slate-800 pl-4">
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Gastos Totales:</span>
            <span className="text-xl font-mono font-black text-red-400">-{formatCurrency(totalExpenses)}</span>
          </div>

          <div className="text-right border-l border-slate-800 pl-4">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Balance Neto:</span>
            <span className={`text-2xl font-mono font-black ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#0d0d1a] p-4 rounded-2xl border border-slate-800/60 shadow-xl shadow-black/20 flex items-center space-x-3">
          <div className="p-3 bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Estacionamiento</span>
            <div className="text-lg font-mono font-black text-slate-100">{formatCurrency(parkingIncome)}</div>
          </div>
        </div>

        <div className="bg-[#0d0d1a] p-4 rounded-2xl border border-slate-800/60 shadow-xl shadow-black/20 flex items-center space-x-3">
          <div className="p-3 bg-amber-950/80 text-amber-400 border border-amber-500/30 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tienda Artículos</span>
            <div className="text-lg font-mono font-black text-slate-100">{formatCurrency(storeIncome)}</div>
          </div>
        </div>

        <div className="bg-[#0d0d1a] p-4 rounded-2xl border border-slate-800/60 shadow-xl shadow-black/20 flex items-center space-x-3">
          <div className="p-3 bg-purple-950/80 text-purple-400 border border-purple-500/30 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Lavado de Autos</span>
            <div className="text-lg font-mono font-black text-slate-100">{formatCurrency(washIncome)}</div>
          </div>
        </div>

        <div className="bg-[#0d0d1a] p-4 rounded-2xl border border-slate-800/60 shadow-xl shadow-black/20 flex items-center space-x-3">
          <div className="p-3 bg-red-950/80 text-red-400 border border-red-500/30 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Gastos Operacionales</span>
            <div className="text-lg font-mono font-black text-red-400">{formatCurrency(totalExpenses)}</div>
          </div>
        </div>

      </div>

      {/* Operational Expenses Section */}
      <div className="bg-[#0d0d1a] rounded-3xl p-6 border border-slate-800/60 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-400" /> Registro de Gastos Operacionales del Local
            </h3>
            <p className="text-xs text-slate-400">Pago de servicios básico (Agua, Luz, Internet, Arriendo, Contador, Mercaderías).</p>
          </div>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-900/40"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Gasto</span>
          </button>
        </div>

        {/* Expenses List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#111122] text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Descripción</th>
                <th className="py-3 px-3">Proveedor / Boleta</th>
                <th className="py-3 px-3">Forma de Pago</th>
                <th className="py-3 px-3 text-right">Monto ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No hay gastos operacionales registrados en este período.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const catInfo = expenseCategoryLabels[exp.category] || expenseCategoryLabels.otro;
                  return (
                    <tr key={exp.id} className="hover:bg-[#111122]">
                      <td className="py-3 px-3 font-mono text-slate-400">{formatDateTime(exp.date)}</td>
                      <td className="py-3 px-3 font-bold text-slate-200">
                        {catInfo.icon} {catInfo.label}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{exp.description}</td>
                      <td className="py-3 px-3 text-slate-400">{exp.supplierOrRef || '---'}</td>
                      <td className="py-3 px-3 capitalize font-bold text-slate-400">{exp.paymentMethod}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-red-400 text-sm">
                        -{formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arqueo y Cuadre de Caja (Shift Closing Form) */}
      <div className="bg-[#0d0d1a] rounded-3xl p-6 border border-slate-800/60 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Arqueo y Cierre de Turno de Caja
          </h3>
          {shiftClosed && (
            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-full font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Turno Cerrado Satisfactoriamente
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Methods Breakdown */}
          <div className="bg-[#111122] p-4 rounded-2xl space-y-2 border border-slate-800 text-xs">
            <h4 className="font-bold text-slate-300 uppercase">Desglose por Forma de Pago</h4>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">💵 Efectivo Cobrado:</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(efectivoTotal)}</span>
            </div>
            {cashExpensesTotal > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-red-400">
                <span>🔻 Gastos Pagados en Efectivo:</span>
                <span className="font-mono font-bold">-{formatCurrency(cashExpensesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-bold">💵 Efectivo Esperado en Caja:</span>
              <span className="font-mono font-black text-emerald-300">{formatCurrency(cashExpected)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">💳 Tarjetas (Déb/Créd):</span>
              <span className="font-mono font-bold text-indigo-400">{formatCurrency(tarjetaTotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">📲 Transferencias:</span>
              <span className="font-mono font-bold text-purple-400">{formatCurrency(transferenciaTotal)}</span>
            </div>
          </div>

          {/* Cash Count Calculation */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Efectivo Físico Contado en Caja ($)
              </label>
              <input
                type="number"
                value={cashCounted}
                onChange={(e) => setCashCounted(e.target.value)}
                placeholder="Ingrese total físico contado"
                className="w-full bg-[#111122] border border-slate-800 rounded-xl p-2.5 font-bold font-mono text-sm text-slate-100 outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="bg-[#111122] p-3 rounded-xl flex items-center justify-between font-bold border border-slate-800">
              <span className="text-slate-300">Diferencia de Arqueo:</span>
              <span className={`font-mono ${cashDifference < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {cashCounted ? formatCurrency(cashDifference) : '$0'}
              </span>
            </div>
          </div>

          {/* Shift Note & Action */}
          <div className="space-y-3 text-xs flex flex-col justify-between">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Observaciones del Cierre</label>
              <textarea
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="Fondo de caja, novedades del turno..."
                className="w-full bg-[#111122] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-hidden focus:border-emerald-500 h-20"
              />
            </div>

            <button
              onClick={() => setShiftClosed(true)}
              disabled={shiftClosed}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-md"
            >
              Finalizar y Generar Informe de Cierre
            </button>
          </div>

        </div>
      </div>

      {/* Transaction History Log Table */}
      <div className="bg-[#0d0d1a] rounded-3xl p-6 border border-slate-800/60 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Historial de Transacciones Registradas
          </h3>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ticket o patente..."
              className="w-full bg-[#111122] border border-slate-800 text-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs outline-hidden focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#111122] text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-3">Ticket / Fecha</th>
                <th className="py-3 px-3">Patente / Detalle</th>
                <th className="py-3 px-3">Método</th>
                <th className="py-3 px-3">Desglose (Estac/Tienda/Lavado)</th>
                <th className="py-3 px-3 text-right">Monto Total</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-[#111122]">
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-200">{t.ticketNumber}</div>
                    <div className="text-[10px] text-slate-500">{formatDateTime(t.date)}</div>
                  </td>
                  <td className="py-3 px-3">
                    {t.plate ? (
                      <span className="font-mono font-bold bg-[#050508] border border-slate-800 text-indigo-300 px-2 py-0.5 rounded text-xs">
                        {t.plate}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Venta Mostrador</span>
                    )}
                  </td>
                  <td className="py-3 px-3 capitalize font-bold text-slate-300">
                    <div>{t.paymentMethod}</div>
                    {t.paymentReference && (
                      <div className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                        Cod: {t.paymentReference}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                    <div className="space-x-2">
                      <span>🅿️ {formatCurrency(t.parkingFee)}</span>
                      <span>🛒 {formatCurrency(t.storeFee)}</span>
                      <span>🧼 {formatCurrency(t.washFee)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                    {formatCurrency(t.total)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onReprintTicket(t)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Reimprimir Ticket"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Register Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-400" /> Registrar Gasto Operacional
              </h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Categoría del Gasto *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 font-bold outline-hidden focus:border-red-500"
                >
                  {Object.entries(expenseCategoryLabels).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.icon} {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descripción del Gasto *</label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="Ej: Pago mensual de factura de energía eléctrica del local"
                  className="w-full bg-[#111122] border border-slate-700/60 text-white rounded-xl p-2.5 font-bold outline-hidden focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Monto ($ CLP) *</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-red-400 font-mono text-sm font-bold rounded-xl p-2.5 outline-hidden focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Forma de Pago</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 font-bold outline-hidden focus:border-red-500"
                  >
                    <option value="efectivo">💵 Efectivo (Caja)</option>
                    <option value="transferencia">📲 Transferencia</option>
                    <option value="tarjeta">💳 Tarjeta Empresarial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Proveedor / N° de Boleta o Factura</label>
                <input
                  type="text"
                  value={expSupplier}
                  onChange={(e) => setExpSupplier(e.target.value)}
                  placeholder="Ej: Enel Boleta N° 991823"
                  className="w-full bg-[#111122] border border-slate-700/60 text-slate-300 rounded-xl p-2.5 outline-hidden focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold cursor-pointer hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold cursor-pointer hover:bg-red-500 shadow-md"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

