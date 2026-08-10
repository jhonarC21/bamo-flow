import React from 'react';
import { Calendar, Car, ShoppingBag, Sparkles, TrendingUp, BarChart3, UserCheck, Lock, Banknote, Stamp, Printer, BookOpen } from 'lucide-react';
import { UserRole } from '../types';

export type TabType = 'patio' | 'lavado' | 'tienda' | 'agenda' | 'informacion' | 'portal_cliente' | 'caja' | 'nomina' | 'grabado_patente' | 'contabilidad';


interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  washOrdersCount: number;
  bookingsTodayCount: number;
  pendingBookingsCount: number;
  lowStockCount: number;
  isClientLoggedIn: boolean;
  userRole?: UserRole;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  washOrdersCount,
  bookingsTodayCount,
  pendingBookingsCount,
  lowStockCount,
  isClientLoggedIn,
  userRole = 'admin',
}) => {
  const isAllowed = (tabId: TabType): boolean => {
    if (userRole === 'admin') return true;
    if (userRole === 'cliente') return tabId === 'portal_cliente';
    if (userRole === 'lavador_parquero') {
      return ['patio', 'lavado', 'agenda', 'portal_cliente', 'grabado_patente'].includes(tabId);
    }
    if (userRole === 'vendedora_tienda') {
      return ['tienda', 'patio', 'lavado', 'portal_cliente', 'grabado_patente'].includes(tabId);
    }
    return true;
  };

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    {
      id: 'patio',
      label: 'Patio de Estacionamiento',
      icon: Car,
    },
    {
      id: 'lavado',
      label: 'Servicio de Lavado',
      icon: Sparkles,
      badge: washOrdersCount,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'grabado_patente',
      label: 'Grabado de Patente (58mm)',
      icon: Printer,
    },
    {
      id: 'tienda',
      label: 'Tienda de Artículos',
      icon: ShoppingBag,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'agenda',
      label: 'Agenda de Reservas',
      icon: Calendar,
      badge: bookingsTodayCount,
      badgeColor: 'bg-indigo-500 text-white',
    },
    {
      id: 'informacion',
      label: 'Métricas & CRM Interno',
      icon: BarChart3,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      id: 'portal_cliente',
      label: 'Portal del Cliente',
      icon: UserCheck,
      badge: isClientLoggedIn ? 1 : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'caja',
      label: 'Reportes y Cierre de Caja',
      icon: TrendingUp,
    },
    {
      id: 'contabilidad',
      label: 'Contabilidad (Libro Diario / Cuentas T)',
      icon: BookOpen,
    },
    {
      id: 'nomina',
      label: 'Pago de Nómina (Ley Chile)',
      icon: Banknote,
    },
  ];

  return (
    <nav className="bg-[#0a0a12]/95 backdrop-blur-md border-b border-slate-800/60 sticky top-[73px] z-20 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const allowed = isAllowed(item.id);

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (allowed) {
                    setActiveTab(item.id);
                  }
                }}
                disabled={!allowed}
                title={!allowed ? 'Acceso restringido para su perfil actual' : item.label}
                className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  !allowed
                    ? 'opacity-40 text-slate-600 bg-slate-950/40 border border-slate-900 cursor-not-allowed'
                    : isActive
                    ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 shadow-md shadow-indigo-950/50 cursor-pointer'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent cursor-pointer'
                }`}
              >
                <Icon className={`w-4 h-4 ${!allowed ? 'text-slate-600' : isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {!allowed && <Lock className="w-3 h-3 text-amber-500/80 ml-0.5" />}
                {allowed && item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-indigo-600 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

