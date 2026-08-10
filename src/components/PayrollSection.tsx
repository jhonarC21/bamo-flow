import React, { useState } from 'react';
import { PayrollSlip, StaffUser, AfpChile, AppConfig } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Banknote, FileText, Plus, Printer, CheckCircle, ShieldAlert, User, Calculator, DollarSign, Download, Building, ShieldCheck, Sparkles } from 'lucide-react';

interface PayrollSectionProps {
  staffUsers: StaffUser[];
  payrollSlips: PayrollSlip[];
  onAddPayrollSlip: (slip: PayrollSlip) => void;
  appConfig?: AppConfig;
}

// AFP rates mapping (10% mandatory + AFP commission rate)
const AFP_RATES: Record<AfpChile, { name: string; ratePercentage: number }> = {
  capital: { name: 'AFP Capital', ratePercentage: 11.44 },
  cuprum: { name: 'AFP Cuprum', ratePercentage: 11.44 },
  habitat: { name: 'AFP Hábitat', ratePercentage: 11.27 },
  planvital: { name: 'AFP PlanVital', ratePercentage: 11.16 },
  provida: { name: 'AFP ProVida', ratePercentage: 11.45 },
  modelo: { name: 'AFP Modelo', ratePercentage: 10.58 },
  uno: { name: 'AFP Uno', ratePercentage: 10.49 },
};

export const PayrollSection: React.FC<PayrollSectionProps> = ({
  staffUsers,
  payrollSlips,
  onAddPayrollSlip,
  appConfig,
}) => {
  const [slips, setSlips] = useState<PayrollSlip[]>(payrollSlips);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffUsers[0]?.id || '');
  const [period, setPeriod] = useState<string>('2026-08');
  
  // Imponible inputs
  const selectedUser = staffUsers.find((u) => u.id === selectedStaffId) || staffUsers[0];
  const [daysWorked, setDaysWorked] = useState<number>(30);
  const [baseSalary, setBaseSalary] = useState<number>(selectedUser?.baseSalary || 520000);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [hasLegalGratification, setHasLegalGratification] = useState<boolean>(true);
  const [bonuses, setBonuses] = useState<number>(0);

  // No Imponible inputs
  const [foodAllowance, setFoodAllowance] = useState<number>(35000);
  const [transportAllowance, setTransportAllowance] = useState<number>(35000);
  const [familyAllowance, setFamilyAllowance] = useState<number>(0);

  // Previsional selections
  const [selectedAfp, setSelectedAfp] = useState<AfpChile>(selectedUser?.afpName || 'Habitat');
  const [healthType, setHealthType] = useState<'Fonasa' | 'Isapre'>(selectedUser?.healthType || 'Fonasa');
  const [healthPercentage, setHealthPercentage] = useState<number>(7.0);
  const [hasAfcWorker, setHasAfcWorker] = useState<boolean>(true);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // Print modal state
  const [viewingSlip, setViewingSlip] = useState<PayrollSlip | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Update base salary when staff user changes
  const handleStaffChange = (userId: string) => {
    setSelectedStaffId(userId);
    const u = staffUsers.find((user) => user.id === userId);
    if (u) {
      if (u.baseSalary) setBaseSalary(u.baseSalary);
      if (u.afpName) setSelectedAfp(u.afpName);
      if (u.healthType) setHealthType(u.healthType);
    }
  };

  // CALCULATIONS (CHILEAN LABOR LAW)
  // 1. Pro-rated base salary if less than 30 days
  const actualBaseSalary = Math.round((baseSalary / 30) * daysWorked);

  // 2. Overtime calculation: (BaseSalary / 180) * 1.5 * overtimeHours
  const hourlyRate = (baseSalary / 180) * 1.5;
  const overtimeAmount = Math.round(hourlyRate * overtimeHours);

  // 3. Gratificación Legal Art. 47: 25% of Imponible, capped at (4.75 * IMM) / 12 (~$197.917 for IMM $500k)
  const subtotalBeforeGrat = actualBaseSalary + overtimeAmount + bonuses;
  const gratificationCapMonthly = 197917; // Legal monthly cap in Chile
  const calculatedGratification = hasLegalGratification
    ? Math.min(Math.round(subtotalBeforeGrat * 0.25), gratificationCapMonthly)
    : 0;

  // 4. Total Haberes Imponibles
  const totalImponible = subtotalBeforeGrat + calculatedGratification;

  // 5. Total Haberes No Imponibles
  const totalNoImponible = foodAllowance + transportAllowance + familyAllowance;

  // 6. Total Haberes Bruto
  const totalGrossPay = totalImponible + totalNoImponible;

  // 7. AFP Deduction
  const afpConfig = AFP_RATES[selectedAfp] || AFP_RATES.habitat;
  const afpDeduction = Math.round((totalImponible * afpConfig.ratePercentage) / 100);

  // 8. Health Deduction (Fonasa 7% or Isapre 7%+)
  const healthDeduction = Math.round((totalImponible * healthPercentage) / 100);

  // 9. AFC Worker Deduction (0.6% for indefinite contracts)
  const afcDeduction = hasAfcWorker ? Math.round((totalImponible * 0.6) / 100) : 0;

  // 10. Total Social Security Deductions
  const totalPrevisionalDeductions = afpDeduction + healthDeduction + afcDeduction;

  // 11. Taxable Income for Second Category Tax (Renta Imponible Afecta a Impuesto)
  const taxableForTax = Math.max(0, totalImponible - totalPrevisionalDeductions);

  // Simplified Chilean 2nd Category Income Tax Table approximation (UTM ~$65.000)
  let incomeTaxDeduction = 0;
  if (taxableForTax > 900000) {
    incomeTaxDeduction = Math.round((taxableForTax - 900000) * 0.04);
  }

  // 12. Total Deductions
  const totalDeductions = totalPrevisionalDeductions + incomeTaxDeduction + advancePayment;

  // 13. Net Pay (Sueldo Líquido Final)
  const netPay = Math.max(0, totalGrossPay - totalDeductions);

  // Emit Payroll Slip
  const handleEmitPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const newSlip: PayrollSlip = {
      id: `PAY-${Date.now()}`,
      period: period,
      dateIssued: new Date().toISOString(),
      employeeId: selectedUser.id,
      employeeName: selectedUser.name,
      employeeRut: selectedUser.rut || '15.432.890-K',
      employeeRole: selectedUser.role,
      contractType: 'indefinido',
      workedDays: daysWorked,
      baseSalary: actualBaseSalary,
      overtimeHours: overtimeHours,
      overtimePay: overtimeAmount,
      legalGratification: calculatedGratification,
      bonusesPay: bonuses,
      totalTaxable: totalImponible,
      lunchAllowance: foodAllowance,
      transportAllowance: transportAllowance,
      familyAllowance: familyAllowance,
      totalNonTaxable: totalNoImponible,
      totalGrossIncome: totalGrossPay,
      afpName: selectedAfp,
      afpRate: afpConfig.ratePercentage,
      afpDeduction: afpDeduction,
      healthType: healthType === 'Isapre' ? 'isapre' : 'fonasa',
      healthRate: healthPercentage,
      healthDeduction: healthDeduction,
      unemploymentInsuranceDeduction: afcDeduction,
      totalSocialDeductions: totalPrevisionalDeductions,
      secondCategoryTax: incomeTaxDeduction,
      otherDeductions: advancePayment,
      totalDeductions: totalDeductions,
      netPay: netPay,
      paymentMethod: 'transferencia',
      status: 'pagado',
    };

    setSlips([newSlip, ...slips]);
    onAddPayrollSlip(newSlip);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-[#0a0a16] p-6 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
            <Banknote className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">Módulo de Nómina & Liquidación de Sueldos</h1>
              <span className="bg-indigo-900/80 text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/40 uppercase">
                Norma Legal Chile (Código del Trabajo)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Cálculo de Haberes Imponibles/No Imponibles, Descuentos Legales AFP, Fonasa/Isapre, AFC e Impuesto Único.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#070712] px-4 py-2 rounded-2xl border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Nómina Emitida</div>
            <div className="text-base font-mono font-black text-emerald-400">
              {formatCurrency(slips.reduce((acc, s) => acc + s.netPay, 0))}
            </div>
          </div>
        </div>
      </div>

      {showSuccessToast && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">
            ¡Liquidación de sueldo procesada exitosamente! Se ha registrado el pago de nómina en el historial oficial.
          </span>
        </div>
      )}

      {/* Main Grid: Generator & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Generator Form (7 cols) */}
        <form onSubmit={handleEmitPayroll} className="lg:col-span-7 bg-[#0d0d1a] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              Parámetros de Cálculo de Liquidación
            </h2>
            <span className="text-xs text-indigo-400 font-mono font-bold">Ley 21.561 / C. del Trabajo</span>
          </div>

          {/* Employee & Period Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Trabajador / Empleado
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => handleStaffChange(e.target.value)}
                className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-white outline-hidden focus:border-indigo-500"
              >
                {staffUsers
                  .filter((u) => u.role !== 'cliente')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — ({u.role.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Periodo de Liquidación (Mes/Año)
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-mono font-bold text-indigo-300 outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Rut and Role summary badge */}
          <div className="bg-[#070712] p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">RUT Trabajador:</span>
              <strong className="font-mono text-slate-200">{selectedUser?.rut || '15.432.890-K'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Cargo / Función:</span>
              <strong className="capitalize text-indigo-300">{selectedUser?.role}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Días Trabajados:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={daysWorked}
                onChange={(e) => setDaysWorked(Math.min(30, Math.max(1, parseInt(e.target.value) || 30)))}
                className="w-16 bg-[#111122] border border-slate-700 rounded-lg text-center font-bold text-amber-400 py-0.5 text-xs"
              />
            </div>
          </div>

          {/* SECTION 1: HABERES IMPONIBLES */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              1. Haberes Imponibles (Sujetos a Descuento Previsional)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Sueldo Base Mensual ($ CLP)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-mono font-bold text-amber-300 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Horas Extraordinarias (50% Recargo Legal)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                    placeholder="Cant. Horas"
                    className="w-24 bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-mono font-bold text-white outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    = {formatCurrency(overtimeAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#070712] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Gratificación Legal (Art. 47)</span>
                  <span className="text-[10px] text-slate-400">25% con tope de 4.75 IMM / 12</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasLegalGratification}
                  onChange={(e) => setHasLegalGratification(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Bonos e Incentivos Imponibles
                </label>
                <input
                  type="number"
                  step="5000"
                  value={bonuses}
                  onChange={(e) => setBonuses(parseFloat(e.target.value) || 0)}
                  placeholder="Comisiones, metas"
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-mono text-slate-200 outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: HABERES NO IMPONIBLES */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              2. Haberes No Imponibles (Asignaciones)
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Asig. Colación
                </label>
                <input
                  type="number"
                  value={foodAllowance}
                  onChange={(e) => setFoodAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Asig. Movilización
                </label>
                <input
                  type="number"
                  value={transportAllowance}
                  onChange={(e) => setTransportAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Cargas Familiares
                </label>
                <input
                  type="number"
                  value={familyAllowance}
                  onChange={(e) => setFamilyAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-mono text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: DESCUENTOS PREVISIONALES Y LEGALES CHILE */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              3. Descuentos Previsionales Legales de Chile
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  AFP (Administradora de Fondos)
                </label>
                <select
                  value={selectedAfp}
                  onChange={(e) => setSelectedAfp(e.target.value as AfpChile)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-indigo-300 outline-hidden"
                >
                  {Object.entries(AFP_RATES).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name} ({item.ratePercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Salud (Fonasa o Isapre)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={healthType}
                    onChange={(e) => setHealthType(e.target.value as 'Fonasa' | 'Isapre')}
                    className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-2.5 text-xs font-bold text-white"
                  >
                    <option value="Fonasa">Fonasa (7%)</option>
                    <option value="Isapre">Isapre (Plan Pactado)</option>
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    min="7"
                    value={healthPercentage}
                    onChange={(e) => setHealthPercentage(parseFloat(e.target.value) || 7)}
                    className="w-16 bg-[#111122] border border-slate-700 rounded-xl py-2 px-1 text-center font-bold font-mono text-indigo-300 text-xs"
                  />
                  <span className="text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#070712] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">AFC Trabajador (0.6%)</span>
                  <span className="text-[10px] text-slate-400">Contrato Indefinido</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasAfcWorker}
                  onChange={(e) => setHasAfcWorker(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Anticipos de Sueldo / Préstamos ($ CLP)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-mono text-rose-300"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-950/60 flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30 transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Emitir y Procesar Pago de Liquidación</span>
          </button>
        </form>

        {/* Right Column: Live Calculated Payroll Ticket & Slip Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Slip Preview Card */}
          <div className="bg-[#050508] border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wide">
                  Desglose Oficial de Liquidación
                </h3>
                <p className="text-[10px] text-slate-400">RUT: {selectedUser?.rut || '15.432.890-K'}</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-xl border border-indigo-800">
                {period}
              </span>
            </div>

            {/* Haberes Box */}
            <div className="bg-[#0d0d1a] p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="font-bold text-indigo-300 text-[11px] border-b border-slate-800 pb-1">
                HABERES
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sueldo Base ({daysWorked} días):</span>
                <span className="font-mono font-bold">{formatCurrency(actualBaseSalary)}</span>
              </div>
              {overtimeAmount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Horas Extra ({overtimeHours} hrs):</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(overtimeAmount)}</span>
                </div>
              )}
              {calculatedGratification > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Gratificación Legal Art. 47:</span>
                  <span className="font-mono font-bold">{formatCurrency(calculatedGratification)}</span>
                </div>
              )}
              {bonuses > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Bonos e Incentivos:</span>
                  <span className="font-mono font-bold">{formatCurrency(bonuses)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-100 pt-1 border-t border-slate-800 text-xs">
                <span>Total Imponible:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(totalImponible)}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/60 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Colación + Movilización + Cargas:</span>
                  <span className="font-mono">{formatCurrency(totalNoImponible)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-100 text-xs">
                  <span>Total Haberes Bruto:</span>
                  <span className="font-mono text-indigo-300">{formatCurrency(totalGrossPay)}</span>
                </div>
              </div>
            </div>

            {/* Descuentos Box */}
            <div className="bg-[#0d0d1a] p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="font-bold text-rose-300 text-[11px] border-b border-slate-800 pb-1">
                DESCUENTOS PREVISIONALES Y LEGALES
              </div>
              <div className="flex justify-between text-slate-300">
                <span>AFP {afpConfig.name} ({afpConfig.ratePercentage}%):</span>
                <span className="font-mono text-rose-400">-{formatCurrency(afpDeduction)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Salud {healthType} ({healthPercentage}%):</span>
                <span className="font-mono text-rose-400">-{formatCurrency(healthDeduction)}</span>
              </div>
              {hasAfcWorker && (
                <div className="flex justify-between text-slate-300">
                  <span>Seguro Cesantía AFC (0.6%):</span>
                  <span className="font-mono text-rose-400">-{formatCurrency(afcDeduction)}</span>
                </div>
              )}
              {incomeTaxDeduction > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Impuesto Único 2da Cat.:</span>
                  <span className="font-mono text-rose-400">-{formatCurrency(incomeTaxDeduction)}</span>
                </div>
              )}
              {advancePayment > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Anticipo de Sueldo:</span>
                  <span className="font-mono text-rose-400">-{formatCurrency(advancePayment)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-rose-300 pt-1 border-t border-slate-800 text-xs">
                <span>Total Descuentos:</span>
                <span className="font-mono">-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>

            {/* Final Net Pay Box */}
            <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Alcance Líquido a Pagar
                </span>
                <span className="text-xs text-slate-300">Sueldo Neto Ley de Chile</span>
              </div>
              <div className="text-xl font-mono font-black text-emerald-300">
                {formatCurrency(netPay)}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SECTION 4: HISTORIAL DE LIQUIDACIONES EMITIDAS */}
      <div className="bg-[#0d0d1a] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Historial de Liquidaciones de Sueldo Emitidas
          </h2>
          <span className="text-xs text-slate-400">Total acumulado: {slips.length} registro(s)</span>
        </div>

        {slips.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No hay liquidaciones registradas en esta sesión. Emita una usando el formulario superior.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-[#070712]">
                  <th className="py-3 px-3">Folio / ID</th>
                  <th className="py-3 px-3">Trabajador</th>
                  <th className="py-3 px-3">Periodo</th>
                  <th className="py-3 px-3 text-right">Haberes Bruto</th>
                  <th className="py-3 px-3 text-right">Descuentos</th>
                  <th className="py-3 px-3 text-right">Sueldo Líquido</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {slips.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{s.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{s.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.employeeRut}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">{s.period}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">{formatCurrency(s.totalGrossIncome)}</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">-{formatCurrency(s.totalDeductions)}</td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400">
                      {formatCurrency(s.netPay)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 uppercase">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setViewingSlip(s)}
                        className="bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ver / Imprimir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINT / PREVIEW MODAL FOR LIQUIDACIÓN DE SUELDO */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full shadow-2xl p-6 space-y-5 my-8 relative border border-slate-300">
            
            {/* Header Documento */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h3 className="text-base font-black uppercase tracking-wide">
                  {appConfig?.appTitle || 'AUTOPARK & CAR WASH CONTROL'}
                </h3>
                <p className="text-xs text-slate-600 font-semibold">LIQUIDACIÓN DE SUELDOS (CÓDIGO DEL TRABAJO DE CHILE)</p>
              </div>
              <div className="text-right font-mono text-xs font-bold">
                <div>FOLIO: {viewingSlip.id}</div>
                <div className="text-indigo-700 uppercase">PERIODO: {viewingSlip.period}</div>
              </div>
            </div>

            {/* Datos Trabajador */}
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Nombre Trabajador:</span>
                <strong className="text-slate-900 font-bold">{viewingSlip.employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">RUT Trabajador:</span>
                <strong className="text-slate-900 font-mono font-bold">{viewingSlip.employeeRut}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Cargo:</span>
                <strong className="text-slate-900 capitalize font-bold">{viewingSlip.employeeRole}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Días Trabajados:</span>
                <strong className="text-slate-900 font-bold">{viewingSlip.workedDays} días</strong>
              </div>
            </div>

            {/* Tabla Desglose Oficial */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* Haberes Column */}
              <div className="border border-slate-300 rounded-xl p-3 space-y-1.5">
                <div className="font-extrabold text-indigo-900 border-b border-slate-300 pb-1 uppercase text-[11px]">
                  HABERES
                </div>
                <div className="flex justify-between">
                  <span>Sueldo Base:</span>
                  <span className="font-mono font-bold">{formatCurrency(viewingSlip.baseSalary)}</span>
                </div>
                {viewingSlip.overtimePay > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Horas Extra ({viewingSlip.overtimeHours}h):</span>
                    <span className="font-mono font-bold">{formatCurrency(viewingSlip.overtimePay)}</span>
                  </div>
                )}
                {viewingSlip.legalGratification > 0 && (
                  <div className="flex justify-between">
                    <span>Gratificación Legal:</span>
                    <span className="font-mono font-bold">{formatCurrency(viewingSlip.legalGratification)}</span>
                  </div>
                )}
                {viewingSlip.bonusesPay > 0 && (
                  <div className="flex justify-between">
                    <span>Bonos / Incentivos:</span>
                    <span className="font-mono font-bold">{formatCurrency(viewingSlip.bonusesPay)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-slate-300 pt-1 text-slate-900">
                  <span>Total Imponible:</span>
                  <span className="font-mono">{formatCurrency(viewingSlip.totalTaxable)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Haberes No Imponibles:</span>
                  <span className="font-mono">{formatCurrency(viewingSlip.totalNonTaxable)}</span>
                </div>
                <div className="flex justify-between font-black text-indigo-950 border-t border-slate-900 pt-1 text-xs">
                  <span>TOTAL HABERES:</span>
                  <span className="font-mono">{formatCurrency(viewingSlip.totalGrossIncome)}</span>
                </div>
              </div>

              {/* Descuentos Column */}
              <div className="border border-slate-300 rounded-xl p-3 space-y-1.5">
                <div className="font-extrabold text-rose-900 border-b border-slate-300 pb-1 uppercase text-[11px]">
                  DESCUENTOS
                </div>
                <div className="flex justify-between">
                  <span>AFP ({viewingSlip.afpName.toUpperCase()}):</span>
                  <span className="font-mono font-bold text-rose-700">-{formatCurrency(viewingSlip.afpDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salud ({viewingSlip.healthType.toUpperCase()}):</span>
                  <span className="font-mono font-bold text-rose-700">-{formatCurrency(viewingSlip.healthDeduction)}</span>
                </div>
                {viewingSlip.unemploymentInsuranceDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>AFC Trabajador:</span>
                    <span className="font-mono text-rose-700">-{formatCurrency(viewingSlip.unemploymentInsuranceDeduction)}</span>
                  </div>
                )}
                {viewingSlip.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Anticipos:</span>
                    <span className="font-mono text-rose-700">-{formatCurrency(viewingSlip.otherDeductions)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-rose-950 border-t border-slate-900 pt-2 text-xs">
                  <span>TOTAL DESCUENTOS:</span>
                  <span className="font-mono">-{formatCurrency(viewingSlip.totalDeductions)}</span>
                </div>
              </div>

            </div>

            {/* Alcance Liquido Box */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between font-mono">
              <span className="font-bold text-xs uppercase tracking-wider">SUELDO LÍQUIDO A RECIBIR:</span>
              <span className="text-xl font-black text-emerald-400">{formatCurrency(viewingSlip.netPay)}</span>
            </div>

            {/* Firmas */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[11px]">
              <div className="border-t border-slate-400 pt-1">
                <span className="font-bold block text-slate-800">Firma del Trabajador</span>
                <span className="text-slate-500 font-mono">RUT: {viewingSlip.employeeRut}</span>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <span className="font-bold block text-slate-800">Firma y Timbre Empleador</span>
                <span className="text-slate-500">AutoPark Control Chile</span>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setViewingSlip(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 text-xs cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Documento</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
