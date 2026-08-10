import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Scale
} from 'lucide-react';
import {
  AccountingAccount,
  AccountingEntry,
  AccountingEntryLine,
  AccountingAccountType,
  Transaction,
  Expense,
  PayrollSlip
} from '../types';

export const DEFAULT_ACCOUNTS: AccountingAccount[] = [
  // ACTIVO
  { code: '1101', name: 'Caja Efectivo', type: 'activo', description: 'Dinero disponible en caja física' },
  { code: '1102', name: 'Banco / Cuenta Corriente', type: 'activo', description: 'Fondos en cuenta bancaria (Transferencias)' },
  { code: '1103', name: 'Transbank / Tarjetas por Cobrar', type: 'activo', description: 'Vouchers de pago con tarjeta' },
  { code: '1104', name: 'Inventario de Mercaderías', type: 'activo', description: 'Stock disponible en tienda' },
  
  // PASIVO
  { code: '2101', name: 'Proveedores por Pagar', type: 'pasivo', description: 'Cuentas por pagar a proveedores' },
  { code: '2102', name: 'IVA Débito Fiscal (19%)', type: 'pasivo', description: 'Impuesto IVA recaudado en ventas' },
  { code: '2103', name: 'Imposiciones y Retenciones', type: 'pasivo', description: 'Leyes sociales por pagar' },
  
  // PATRIMONIO
  { code: '3101', name: 'Capital Social / Aportes', type: 'patrimonio', description: 'Aporte inicial de los socios' },
  { code: '3201', name: 'Utilidades Acumuladas', type: 'patrimonio', description: 'Resultados de ejercicios anteriores' },
  
  // INGRESOS
  { code: '4101', name: 'Ingresos por Estacionamiento', type: 'ingreso', description: 'Recaudación por tiempo y tramos' },
  { code: '4102', name: 'Ingresos por Servicio de Lavado', type: 'ingreso', description: 'Ventas de lavado de autos' },
  { code: '4103', name: 'Ventas Tienda de Artículos', type: 'ingreso', description: 'Ventas de insumos y accesorios' },
  { code: '4104', name: 'Ingresos Arriendo Nocturno', type: 'ingreso', description: 'Tarifa mensual o semanal de pernocte' },
  { code: '4105', name: 'Otros Ingresos Operacionales', type: 'ingreso', description: 'Recargos u otros conceptos' },
  
  // GASTOS
  { code: '5101', name: 'Gastos Servicios Básicos (Luz/Agua/Net)', type: 'gasto', description: 'Cuentas de agua, electricidad e internet' },
  { code: '5102', name: 'Arriendo de Terreno / Local', type: 'gasto', description: 'Pago de arriendo mensual del predio' },
  { code: '5103', name: 'Remuneraciones y Sueldos', type: 'gasto', description: 'Pago de nóminas a trabajadores' },
  { code: '5104', name: 'Mantenimiento e Insumos', type: 'gasto', description: 'Reparaciones y detergentes de lavado' },
  { code: '5105', name: 'Costo de Ventas (Mercadería)', type: 'gasto', description: 'Costo de reposición de tienda' },
  { code: '5106', name: 'Honorarios y Asesorías', type: 'gasto', description: 'Gastos de contador y licencias' },
  { code: '5107', name: 'Otros Gastos Operacionales', type: 'gasto', description: 'Imprevistos y varios' },
];

interface AccountingSectionProps {
  transactions: Transaction[];
  expenses: Expense[];
  payrollSlips: PayrollSlip[];
  entries: AccountingEntry[];
  onSaveEntries: (entries: AccountingEntry[]) => void;
}

export const AccountingSection: React.FC<AccountingSectionProps> = ({
  transactions,
  expenses,
  payrollSlips,
  entries,
  onSaveEntries,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'resumen' | 'diario' | 'mayor_t' | 'balance' | 'cuentas'>('diario');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // 'all', '2026-08', '2026', etc.
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<AccountingAccount[]>(() => {
    const saved = localStorage.getItem('autopark_accounting_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('autopark_accounting_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Form state for New Entry Modal
  const [modalDate, setModalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modalConcept, setModalConcept] = useState<string>('');
  const [modalLines, setModalLines] = useState<
    { accountCode: string; debe: number; haber: number; memo: string }[]
  >([
    { accountCode: '1101', debe: 0, haber: 0, memo: '' },
    { accountCode: '4101', debe: 0, haber: 0, memo: '' },
  ]);

  // Sync automatic entries from transactions and expenses
  const handleAutoSync = () => {
    let nextNum = entries.length > 0 ? Math.max(...entries.map((e) => e.entryNumber || 0)) + 1 : 1;
    const newSyncedEntries: AccountingEntry[] = [...entries];
    const existingRefIds = new Set(entries.map((e) => e.referenceId).filter(Boolean));

    let addedCount = 0;

    // 1. Process Transactions
    transactions.forEach((tx) => {
      if (existingRefIds.has(tx.id)) return;

      const dateStr = tx.date.split('T')[0];
      const netAmount = tx.netTotal || Math.round(tx.total / 1.19);
      const vat = tx.vatAmount || (tx.total - netAmount);

      // Determine asset payment account
      let assetCode = '1101'; // Caja
      let assetName = 'Caja Efectivo';
      if (tx.paymentMethod === 'tarjeta') {
        assetCode = '1103';
        assetName = 'Transbank / Tarjetas por Cobrar';
      } else if (tx.paymentMethod === 'transferencia') {
        assetCode = '1102';
        assetName = 'Banco / Cuenta Corriente';
      }

      // Determine revenue account
      let revCode = '4101';
      let revName = 'Ingresos por Estacionamiento';
      if (tx.type === 'lavado') {
        revCode = '4102';
        revName = 'Ingresos por Servicio de Lavado';
      } else if (tx.type === 'tienda') {
        revCode = '4103';
        revName = 'Ventas Tienda de Artículos';
      } else if (tx.type === 'arriendo_nocturno') {
        revCode = '4104';
        revName = 'Ingresos Arriendo Nocturno';
      }

      const lines: AccountingEntryLine[] = [
        {
          accountCode: assetCode,
          accountName: assetName,
          accountType: 'activo',
          debe: tx.total,
          haber: 0,
          memo: `Cobro ${tx.paymentMethod.toUpperCase()} ${tx.plate || ''}`,
        },
        {
          accountCode: revCode,
          accountName: revName,
          accountType: 'ingreso',
          debe: 0,
          haber: netAmount,
          memo: `Venta Neta Boleta ${tx.boletaNumber || ''}`,
        },
        {
          accountCode: '2102',
          accountName: 'IVA Débito Fiscal (19%)',
          accountType: 'pasivo',
          debe: 0,
          haber: vat,
          memo: 'IVA Débito Fiscal 19%',
        },
      ];

      newSyncedEntries.push({
        id: `asi-tx-${tx.id}`,
        entryNumber: nextNum++,
        date: dateStr,
        concept: `Venta - Boleta N° ${tx.boletaNumber || tx.ticketNumber} (${tx.plate || 'Cliente'})`,
        lines,
        totalDebe: tx.total,
        totalHaber: tx.total,
        sourceType: 'auto_venta',
        referenceId: tx.id,
        createdAt: new Date().toISOString(),
      });

      addedCount++;
    });

    // 2. Process Expenses
    expenses.forEach((exp) => {
      if (existingRefIds.has(exp.id)) return;

      const dateStr = exp.date.split('T')[0];

      // Source Asset account
      let assetCode = '1101';
      let assetName = 'Caja Efectivo';
      if (exp.paymentMethod === 'tarjeta') {
        assetCode = '1103';
        assetName = 'Transbank / Tarjetas por Cobrar';
      } else if (exp.paymentMethod === 'transferencia') {
        assetCode = '1102';
        assetName = 'Banco / Cuenta Corriente';
      }

      // Expense Account
      let expCode = '5107';
      let expName = 'Otros Gastos Operacionales';
      if (exp.category === 'agua' || exp.category === 'luz' || exp.category === 'internet') {
        expCode = '5101';
        expName = 'Gastos Servicios Básicos (Luz/Agua/Net)';
      } else if (exp.category === 'arriendo') {
        expCode = '5102';
        expName = 'Arriendo de Terreno / Local';
      } else if (exp.category === 'sueldos') {
        expCode = '5103';
        expName = 'Remuneraciones y Sueldos';
      } else if (exp.category === 'mantenimiento') {
        expCode = '5104';
        expName = 'Mantenimiento e Insumos';
      } else if (exp.category === 'mercancia') {
        expCode = '5105';
        expName = 'Costo de Ventas (Mercadería)';
      } else if (exp.category === 'contador') {
        expCode = '5106';
        expName = 'Honorarios y Asesorías';
      }

      const lines: AccountingEntryLine[] = [
        {
          accountCode: expCode,
          accountName: expName,
          accountType: 'gasto',
          debe: exp.amount,
          haber: 0,
          memo: exp.description,
        },
        {
          accountCode: assetCode,
          accountName: assetName,
          accountType: 'activo',
          debe: 0,
          haber: exp.amount,
          memo: `Salida de dinero (${exp.paymentMethod})`,
        },
      ];

      newSyncedEntries.push({
        id: `asi-exp-${exp.id}`,
        entryNumber: nextNum++,
        date: dateStr,
        concept: `Egresos - ${exp.categoryLabel}: ${exp.description}`,
        lines,
        totalDebe: exp.amount,
        totalHaber: exp.amount,
        sourceType: 'auto_gasto',
        referenceId: exp.id,
        createdAt: new Date().toISOString(),
      });

      addedCount++;
    });

    // Sort by entryNumber
    newSyncedEntries.sort((a, b) => b.entryNumber - a.entryNumber);
    onSaveEntries(newSyncedEntries);

    if (addedCount > 0) {
      alert(`Se sincronizaron automáticamente ${addedCount} nuevos asientos contables desde las operaciones.`);
    } else {
      alert(`Los asientos contables ya están totalmente al día con las ventas y gastos.`);
    }
  };

  // Filtered Entries based on period and search term
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Period filter
      if (selectedPeriod !== 'all') {
        if (!e.date.startsWith(selectedPeriod)) return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const inConcept = e.concept.toLowerCase().includes(q);
        const inNum = e.entryNumber.toString().includes(q);
        const inLines = e.lines.some(
          (l) => l.accountName.toLowerCase().includes(q) || l.accountCode.includes(q)
        );
        return inConcept || inNum || inLines;
      }
      return true;
    });
  }, [entries, selectedPeriod, searchTerm]);

  // Total calculations for summary
  const summaryMetrics = useMemo(() => {
    let totalIngresos = 0;
    let totalGastos = 0;
    let totalIvaDebito = 0;
    let totalCaja = 0;
    let totalBanco = 0;
    let totalTransbank = 0;

    filteredEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.accountType === 'ingreso') {
          totalIngresos += line.haber - line.debe;
        }
        if (line.accountType === 'gasto') {
          totalGastos += line.debe - line.haber;
        }
        if (line.accountCode === '2102') {
          totalIvaDebito += line.haber - line.debe;
        }
        if (line.accountCode === '1101') {
          totalCaja += line.debe - line.haber;
        }
        if (line.accountCode === '1102') {
          totalBanco += line.debe - line.haber;
        }
        if (line.accountCode === '1103') {
          totalTransbank += line.debe - line.haber;
        }
      });
    });

    const utilidadNeta = totalIngresos - totalGastos;

    return {
      totalIngresos,
      totalGastos,
      utilidadNeta,
      totalIvaDebito,
      totalCaja,
      totalBanco,
      totalTransbank,
    };
  }, [filteredEntries]);

  // Compute T-Accounts (Libro Mayor)
  const tAccountsData = useMemo(() => {
    const map: Record<
      string,
      {
        account: AccountingAccount;
        debeLines: { date: string; entryNumber: number; concept: string; amount: number }[];
        haberLines: { date: string; entryNumber: number; concept: string; amount: number }[];
        sumDebe: number;
        sumHaber: number;
        saldo: number;
        tipoSaldo: 'deudor' | 'acreedor' | 'neutro';
      }
    > = {};

    accounts.forEach((acc) => {
      map[acc.code] = {
        account: acc,
        debeLines: [],
        haberLines: [],
        sumDebe: 0,
        sumHaber: 0,
        saldo: 0,
        tipoSaldo: 'neutro',
      };
    });

    filteredEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!map[line.accountCode]) {
          map[line.accountCode] = {
            account: {
              code: line.accountCode,
              name: line.accountName,
              type: line.accountType,
            },
            debeLines: [],
            haberLines: [],
            sumDebe: 0,
            sumHaber: 0,
            saldo: 0,
            tipoSaldo: 'neutro',
          };
        }

        if (line.debe > 0) {
          map[line.accountCode].debeLines.push({
            date: entry.date,
            entryNumber: entry.entryNumber,
            concept: entry.concept,
            amount: line.debe,
          });
          map[line.accountCode].sumDebe += line.debe;
        }
        if (line.haber > 0) {
          map[line.accountCode].haberLines.push({
            date: entry.date,
            entryNumber: entry.entryNumber,
            concept: entry.concept,
            amount: line.haber,
          });
          map[line.accountCode].sumHaber += line.haber;
        }
      });
    });

    // Calculate balances
    Object.values(map).forEach((item) => {
      const diff = item.sumDebe - item.sumHaber;
      if (diff > 0) {
        item.saldo = diff;
        item.tipoSaldo = 'deudor';
      } else if (diff < 0) {
        item.saldo = Math.abs(diff);
        item.tipoSaldo = 'acreedor';
      } else {
        item.saldo = 0;
        item.tipoSaldo = 'neutro';
      }
    });

    return Object.values(map).filter(
      (item) => item.sumDebe > 0 || item.sumHaber > 0 || accounts.some((a) => a.code === item.account.code)
    );
  }, [filteredEntries, accounts]);

  // Modal Line handlers
  const handleAddModalLine = () => {
    setModalLines((prev) => [...prev, { accountCode: accounts[0].code, debe: 0, haber: 0, memo: '' }]);
  };

  const handleRemoveModalLine = (idx: number) => {
    if (modalLines.length <= 2) {
      alert('Un asiento contable requiere al menos 2 cuentas (Partida Doble).');
      return;
    }
    setModalLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalModalDebe = modalLines.reduce((acc, l) => acc + (Number(l.debe) || 0), 0);
  const totalModalHaber = modalLines.reduce((acc, l) => acc + (Number(l.haber) || 0), 0);
  const isModalBalanced = totalModalDebe > 0 && totalModalDebe === totalModalHaber;

  const handleSaveManualEntry = () => {
    if (!modalConcept.trim()) {
      alert('Debe ingresar un concepto o glosa explicativa para el asiento contable.');
      return;
    }
    if (!isModalBalanced) {
      alert(
        `El asiento no está cuadrado. Total DEBE ($${totalModalDebe.toLocaleString('es-CL')}) debe ser igual a Total HABER ($${totalModalHaber.toLocaleString('es-CL')}).`
      );
      return;
    }

    const nextNum = entries.length > 0 ? Math.max(...entries.map((e) => e.entryNumber || 0)) + 1 : 1;

    const formattedLines: AccountingEntryLine[] = modalLines.map((ml) => {
      const acc = accounts.find((a) => a.code === ml.accountCode) || {
        code: ml.accountCode,
        name: 'Cuenta General',
        type: 'activo' as AccountingAccountType,
      };
      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        debe: Number(ml.debe) || 0,
        haber: Number(ml.haber) || 0,
        memo: ml.memo,
      };
    });

    const newEntry: AccountingEntry = {
      id: `asi-manual-${Date.now()}`,
      entryNumber: nextNum,
      date: modalDate,
      concept: modalConcept.trim(),
      lines: formattedLines,
      totalDebe: totalModalDebe,
      totalHaber: totalModalHaber,
      sourceType: 'manual',
      createdAt: new Date().toISOString(),
    };

    onSaveEntries([newEntry, ...entries]);
    setIsNewModalOpen(false);
    setModalConcept('');
    setModalLines([
      { accountCode: '1101', debe: 0, haber: 0, memo: '' },
      { accountCode: '4101', debe: 0, haber: 0, memo: '' },
    ]);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('¿Está seguro de eliminar este asiento contable? Se desajustará el libro diario.')) {
      onSaveEntries(entries.filter((e) => e.id !== entryId));
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (entries.length === 0) {
      alert('No hay asientos contables para exportar.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'N° Asiento,Fecha,Glosa,Codigo Cuenta,Nombre Cuenta,Tipo,Debe (CLP),Haber (CLP),Detalle\n';

    filteredEntries.forEach((e) => {
      e.lines.forEach((l) => {
        const lineStr = `"${e.entryNumber}","${e.date}","${e.concept.replace(/"/g, '""')}","${l.accountCode}","${l.accountName}","${l.accountType}","${l.debe}","${l.haber}","${(l.memo || '').replace(/"/g, '""')}"`;
        csvContent += lineStr + '\n';
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Libro_Diario_Contable_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Contabilidad & Libro Diario (SII Chile)
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Registro contable por partida doble, libro mayor con Cuentas en T, cálculo automático de IVA Débito y
            balance de comprobación de ingresos y egresos reales.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={handleAutoSync}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="Sincroniza automáticamente ventas y gastos en el Libro Diario"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span>Sincronizar Operaciones</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-950/80 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Asiento Manual</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold cursor-pointer"
            title="Exportar a CSV para Contabilidad / SII"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0e0e18] p-4 rounded-2xl border border-emerald-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Ingresos Reales</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight">
            ${summaryMetrics.totalIngresos.toLocaleString('es-CL')}
          </p>
          <span className="text-[10px] text-slate-500 block">Neto Contable acumulado</span>
        </div>

        <div className="bg-[#0e0e18] p-4 rounded-2xl border border-rose-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Egresos Reales</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-rose-400 tracking-tight">
            ${summaryMetrics.totalGastos.toLocaleString('es-CL')}
          </p>
          <span className="text-[10px] text-slate-500 block">Gastos y costos operacionales</span>
        </div>

        <div className="bg-[#0e0e18] p-4 rounded-2xl border border-indigo-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Utilidad Neta</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <p
            className={`text-lg sm:text-xl font-black tracking-tight ${
              summaryMetrics.utilidadNeta >= 0 ? 'text-indigo-300' : 'text-rose-400'
            }`}
          >
            ${summaryMetrics.utilidadNeta.toLocaleString('es-CL')}
          </p>
          <span className="text-[10px] text-slate-500 block">Resultado antes de impuestos</span>
        </div>

        <div className="bg-[#0e0e18] p-4 rounded-2xl border border-amber-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>IVA Débito (19%)</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-amber-300 tracking-tight">
            ${summaryMetrics.totalIvaDebito.toLocaleString('es-CL')}
          </p>
          <span className="text-[10px] text-slate-500 block">Para Declaración F29 SII</span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-[#0e0e18] p-4 rounded-2xl border border-blue-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Liquidez Caja/Banco</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-blue-300 tracking-tight">
            ${(summaryMetrics.totalCaja + summaryMetrics.totalBanco + summaryMetrics.totalTransbank).toLocaleString('es-CL')}
          </p>
          <span className="text-[10px] text-slate-400 block">
            Caja: ${summaryMetrics.totalCaja.toLocaleString('es-CL')} | Banco: ${summaryMetrics.totalBanco.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filters Bar */}
      <div className="bg-[#0a0a12] p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Sub-Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('diario')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'diario'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Libro Diario ({filteredEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mayor_t')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'mayor_t'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Libro Mayor (Cuentas T)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('balance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'balance'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Balance de Comprobación</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cuentas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'cuentas'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Plan de Cuentas ({accounts.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Period Filter */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-[#111122] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-3 text-xs text-slate-200 outline-hidden font-semibold cursor-pointer"
            >
              <option value="all">Todo el Histórico</option>
              <option value="2026-08">Agosto 2026</option>
              <option value="2026-07">Julio 2026</option>
              <option value="2026-06">Junio 2026</option>
              <option value="2026">Año 2026 Completo</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar glosa o cuenta..."
              className="w-full bg-[#111122] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-hidden placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: LIBRO DIARIO */}
      {activeSubTab === 'diario' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="bg-[#0a0a12] rounded-3xl p-12 text-center border border-slate-800/80 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-slate-300">No hay asientos contables registrados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Haga clic en <span className="text-indigo-400 font-bold">"Sincronizar Operaciones"</span> para importar
                todas las ventas de estacionamiento, servicio de lavado y gastos operacionales al Libro Diario.
              </p>
              <button
                onClick={handleAutoSync}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sincronizar Ahora</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#0b0b14] rounded-2xl border border-slate-800/80 p-4 hover:border-slate-700 transition-all space-y-3 shadow-md"
                >
                  {/* Entry Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 font-mono text-xs font-extrabold border border-indigo-500/40">
                        Asiento N° {entry.entryNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {entry.date}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          entry.sourceType === 'auto_venta'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                            : entry.sourceType === 'auto_gasto'
                            ? 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {entry.sourceType === 'auto_venta'
                          ? 'Venta Auto'
                          : entry.sourceType === 'auto_gasto'
                          ? 'Gasto Auto'
                          : 'Asiento Manual'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-extrabold text-slate-300">
                        Cuadrado: ${entry.totalDebe.toLocaleString('es-CL')}
                      </span>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Eliminar asiento contable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Concept / Glosa */}
                  <p className="text-xs font-bold text-slate-200">
                    Glosa: <span className="font-normal text-slate-300">{entry.concept}</span>
                  </p>

                  {/* Double Entry Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 bg-[#07070d]">
                          <th className="py-1.5 px-3">Código</th>
                          <th className="py-1.5 px-3">Cuenta Contable</th>
                          <th className="py-1.5 px-3">Detalle / Memo</th>
                          <th className="py-1.5 px-3 text-right">DEBE ($)</th>
                          <th className="py-1.5 px-3 text-right">HABER ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {entry.lines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-1.5 px-3 font-mono font-bold text-indigo-400">{line.accountCode}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-200">{line.accountName}</td>
                            <td className="py-1.5 px-3 text-slate-400 text-[11px]">{line.memo || '-'}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-400">
                              {line.debe > 0 ? `$${line.debe.toLocaleString('es-CL')}` : '-'}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-sky-400">
                              {line.haber > 0 ? `$${line.haber.toLocaleString('es-CL')}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LIBRO MAYOR (CUENTAS EN T) */}
      {activeSubTab === 'mayor_t' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a12] p-4 rounded-2xl border border-slate-800 text-xs text-slate-400">
            <span className="font-bold text-slate-200">Mayorización en T:</span> A continuación se representan todas
            las cuentas contables activas con sus cargos (DEBE en el lado izquierdo) y abonos (HABER en el lado derecho),
            así como su Saldo Deudor o Acreedor final.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tAccountsData.map((tAcc) => (
              <div
                key={tAcc.account.code}
                className="bg-[#0a0a12] rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col"
              >
                {/* T Header */}
                <div className="bg-[#111122] p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                      {tAcc.account.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 tracking-tight">{tAcc.account.name}</h4>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      tAcc.account.type === 'activo'
                        ? 'bg-emerald-950 text-emerald-400'
                        : tAcc.account.type === 'pasivo'
                        ? 'bg-amber-950 text-amber-400'
                        : tAcc.account.type === 'ingreso'
                        ? 'bg-sky-950 text-sky-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {tAcc.account.type}
                  </span>
                </div>

                {/* T-Account Body: Side-by-Side (DEBE vs HABER) */}
                <div className="grid grid-cols-2 flex-1 border-b border-slate-800 divide-x divide-slate-800 text-xs min-h-[140px]">
                  {/* Left Column: DEBE */}
                  <div className="p-2.5 space-y-1.5 bg-[#08080f]">
                    <span className="block text-[10px] font-black text-emerald-400 border-b border-slate-800 pb-1 uppercase tracking-wider text-center">
                      DEBE (Cargos)
                    </span>
                    {tAcc.debeLines.length === 0 ? (
                      <p className="text-[10px] text-slate-600 text-center italic py-2">- Sin movimientos -</p>
                    ) : (
                      tAcc.debeLines.map((dl, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-[9px] font-mono text-slate-500">#{dl.entryNumber}</span>
                          <span className="font-mono font-bold text-emerald-400">
                            ${dl.amount.toLocaleString('es-CL')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right Column: HABER */}
                  <div className="p-2.5 space-y-1.5 bg-[#08080f]">
                    <span className="block text-[10px] font-black text-sky-400 border-b border-slate-800 pb-1 uppercase tracking-wider text-center">
                      HABER (Abonos)
                    </span>
                    {tAcc.haberLines.length === 0 ? (
                      <p className="text-[10px] text-slate-600 text-center italic py-2">- Sin movimientos -</p>
                    ) : (
                      tAcc.haberLines.map((hl, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-[9px] font-mono text-slate-500">#{hl.entryNumber}</span>
                          <span className="font-mono font-bold text-sky-400">
                            ${hl.amount.toLocaleString('es-CL')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* T Footer: Sums & Balance */}
                <div className="bg-[#0e0e18] p-3 text-xs space-y-1.5">
                  <div className="flex justify-between font-mono text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                    <span>Suma: ${tAcc.sumDebe.toLocaleString('es-CL')}</span>
                    <span>Suma: ${tAcc.sumHaber.toLocaleString('es-CL')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Saldo {tAcc.tipoSaldo.toUpperCase()}:
                    </span>
                    <span
                      className={`font-mono font-extrabold ${
                        tAcc.tipoSaldo === 'deudor'
                          ? 'text-emerald-400'
                          : tAcc.tipoSaldo === 'acreedor'
                          ? 'text-sky-400'
                          : 'text-slate-500'
                      }`}
                    >
                      ${tAcc.saldo.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: BALANCE DE COMPROBACIÓN Y SALDOS */}
      {activeSubTab === 'balance' && (
        <div className="bg-[#0a0a12] rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-200">Balance de Comprobación y Saldos</h3>
              <p className="text-xs text-slate-400">Resumen integral de sumas y saldos por cuenta contable</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-3 py-1 rounded-xl border border-indigo-500/30">
              Período: {selectedPeriod}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#111122] text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Cuenta Contable</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Suma DEBE</th>
                  <th className="py-2.5 px-3 text-right">Suma HABER</th>
                  <th className="py-2.5 px-3 text-right">Saldo DEUDOR</th>
                  <th className="py-2.5 px-3 text-right">Saldo ACREEDOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tAccountsData.map((tAcc) => (
                  <tr key={tAcc.account.code} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-indigo-400">{tAcc.account.code}</td>
                    <td className="py-2 px-3 font-semibold text-slate-200">{tAcc.account.name}</td>
                    <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-400">{tAcc.account.type}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      ${tAcc.sumDebe.toLocaleString('es-CL')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      ${tAcc.sumHaber.toLocaleString('es-CL')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                      {tAcc.tipoSaldo === 'deudor' ? `$${tAcc.saldo.toLocaleString('es-CL')}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-sky-400">
                      {tAcc.tipoSaldo === 'acreedor' ? `$${tAcc.saldo.toLocaleString('es-CL')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#111122] text-slate-100 font-extrabold text-xs border-t-2 border-slate-700">
                  <td colSpan={3} className="py-3 px-3 uppercase">
                    Totales Balance
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-300">
                    ${tAccountsData.reduce((acc, t) => acc + t.sumDebe, 0).toLocaleString('es-CL')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-300">
                    ${tAccountsData.reduce((acc, t) => acc + t.sumHaber, 0).toLocaleString('es-CL')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    $
                    {tAccountsData
                      .filter((t) => t.tipoSaldo === 'deudor')
                      .reduce((acc, t) => acc + t.saldo, 0)
                      .toLocaleString('es-CL')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sky-400">
                    $
                    {tAccountsData
                      .filter((t) => t.tipoSaldo === 'acreedor')
                      .reduce((acc, t) => acc + t.saldo, 0)
                      .toLocaleString('es-CL')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: PLAN DE CUENTAS */}
      {activeSubTab === 'cuentas' && (
        <div className="bg-[#0a0a12] rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-200">Plan de Cuentas Contables</h3>
              <p className="text-xs text-slate-400">
                Estructura oficial de cuentas de Activo, Pasivo, Patrimonio, Ingresos y Gastos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <div
                key={acc.code}
                className="bg-[#111122] p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                      {acc.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">{acc.name}</h4>
                  </div>
                  {acc.description && <p className="text-[10px] text-slate-400">{acc.description}</p>}
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                  {acc.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREAR ASIENTO MANUAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a12] rounded-3xl border border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#111122] p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Registrar Nuevo Asiento Contable Manual</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Fecha Asiento</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-[#111122] border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Glosa / Concepto Explicativo</label>
                  <input
                    type="text"
                    value={modalConcept}
                    onChange={(e) => setModalConcept(e.target.value)}
                    placeholder="Ej: Pago de arriendo local comercial con transferencia"
                    className="w-full bg-[#111122] border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-200 outline-hidden"
                  />
                </div>
              </div>

              {/* Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Detalle Cuentas (Partida Doble)</span>
                  <button
                    type="button"
                    onClick={handleAddModalLine}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Línea</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {modalLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="bg-[#111122] p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-2"
                    >
                      <div className="flex-1 w-full">
                        <select
                          value={line.accountCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModalLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, accountCode: val } : l))
                            );
                          }}
                          className="w-full bg-[#0a0a12] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-2.5 text-xs text-slate-200 outline-hidden font-medium"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-28">
                        <input
                          type="number"
                          placeholder="DEBE ($)"
                          value={line.debe || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setModalLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, debe: val, haber: val > 0 ? 0 : l.haber } : l))
                            );
                          }}
                          className="w-full bg-[#0a0a12] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-2.5 text-xs text-emerald-400 font-mono font-bold outline-hidden placeholder:text-slate-600"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <input
                          type="number"
                          placeholder="HABER ($)"
                          value={line.haber || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setModalLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, haber: val, debe: val > 0 ? 0 : l.debe } : l))
                            );
                          }}
                          className="w-full bg-[#0a0a12] border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-2.5 text-xs text-sky-400 font-mono font-bold outline-hidden placeholder:text-slate-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveModalLine(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance Verification Banner */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  isModalBalanced
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isModalBalanced ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-bold">
                    {isModalBalanced
                      ? 'Asiento Cuadrado Correctamente (Partida Doble Ok)'
                      : 'Asiento Descuadrado: Total Debe y Haber deben coincidir'}
                  </span>
                </div>
                <div className="font-mono font-extrabold text-right space-x-3">
                  <span>DEBE: ${totalModalDebe.toLocaleString('es-CL')}</span>
                  <span>HABER: ${totalModalHaber.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#111122] p-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveManualEntry}
                disabled={!isModalBalanced || !modalConcept.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-extrabold shadow-lg shadow-indigo-950 cursor-pointer transition-all"
              >
                Guardar Asiento Contable
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
