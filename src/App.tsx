import React, { useState, useEffect } from 'react';
import {
  ActiveVehicle,
  Booking,
  BookingStatus,
  CarWashService,
  CartItem,
  ChargingMode,
  ParkingSpot,
  RateConfig,
  StoreItem,
  Transaction,
  VehicleType,
  WashOrder,
  WashStatus,
  VehicleClientRecord,
  ClientReview,
  ClientUser,
  Expense,
  UserRole,
  StaffUser,
  PayrollSlip,
  AppConfig,
  AccountingEntry,
} from './types';


const defaultAppConfig: AppConfig = {
  appTitle: 'AutoPark & CarWash Control',
  logoUrl: '',
  cardFeePercentage: 2.5,
  appPin: '12345678',
  printer58mm: {
    widthMm: 58,
    headerText: 'AUTOPARK & CAR WASH CONTROL',
    footerText: '¡Gracias por su preferencia! Conserve este comprobante.',
    showQr: true,
    fontSizePx: 12,
    showLogo: true,
    logoUrl: '',
    featuredText: 'CONSERVE SU TICKET DE ESTACIONAMIENTO - SI LO PIERDE MULTA DE $10.000',
  },
  isLocked: false,
};
import {
  defaultRateConfig,
  initialActiveVehicles,
  initialBookings,
  initialSpots,
  initialStoreItems,
  initialTransactions,
  initialWashOrders,
  initialWashServices,
  initialClientRecords,
  initialClientReviews,
  initialExpenses,
  initialStaffUsers,
  initialPayrollSlips,
} from './data/initialData';

import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { ParkingGrid } from './components/ParkingGrid';
import { VehicleEntryModal } from './components/VehicleEntryModal';
import { VehicleCheckoutModal } from './components/VehicleCheckoutModal';
import { CarWashSection } from './components/CarWashSection';
import { StoreSection } from './components/StoreSection';
import { AgendaSection } from './components/AgendaSection';
import { ReportsSection } from './components/ReportsSection';
import { SettingsModal } from './components/SettingsModal';
import { TicketPrintModal } from './components/TicketPrintModal';
import { MetricsCrmSection } from './components/MetricsCrmSection';
import { ClientPortalSection } from './components/ClientPortalSection';
import { VehicleQRModal } from './components/VehicleQRModal';
import { VehicleEditTimeModal } from './components/VehicleEditTimeModal';
import { PayrollSection } from './components/PayrollSection';
import { PlateEngravingSection } from './components/PlateEngravingSection';
import { AccountingSection } from './components/AccountingSection';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { LiveVehicleTrackerModal } from './components/LiveVehicleTrackerModal';
import { LockOverlayModal } from './components/LockOverlayModal';
import {
  fetchAllCloudData,
  syncActiveVehicleCloud,
  deleteActiveVehicleCloud,
  syncTransactionCloud,
  syncWashOrderCloud,
  deleteWashOrderCloud,
  syncExpenseCloud,
  syncAccountingEntryCloud,
  syncBookingCloud,
  syncSpotsCloud,
  syncStoreCatalogCloud,
  syncStaffUsersCloud,
  syncClientRecordsCloud,
  syncClientReviewsCloud,
} from './lib/supabase';



export default function App() {
  // One-time cleanup of old demo data from localStorage if present
  if (typeof window !== 'undefined' && !localStorage.getItem('autopark_demo_v3_cleared')) {
    localStorage.removeItem('autopark_vehicles');
    localStorage.removeItem('autopark_wash_orders');
    localStorage.removeItem('autopark_bookings');
    localStorage.removeItem('autopark_transactions');
    localStorage.removeItem('autopark_expenses');
    localStorage.removeItem('autopark_payroll');
    localStorage.removeItem('autopark_accounting_entries');
    localStorage.removeItem('autopark_client_records');
    localStorage.removeItem('autopark_client_reviews');
    localStorage.removeItem('autopark_spots');
    localStorage.setItem('autopark_demo_v3_cleared', 'true');
  }

  // Main State initialized from localStorage or initial defaults
  const [rateConfig, setRateConfig] = useState<RateConfig>(() => {
    const saved = localStorage.getItem('autopark_config');
    return saved ? JSON.parse(saved) : defaultRateConfig;
  });

  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('autopark_app_config');
    return saved ? JSON.parse(saved) : defaultAppConfig;
  });

  const [spots, setSpots] = useState<ParkingSpot[]>(() => {
    const saved = localStorage.getItem('autopark_spots');
    return saved ? JSON.parse(saved) : initialSpots;
  });

  const [activeVehicles, setActiveVehicles] = useState<ActiveVehicle[]>(() => {
    const saved = localStorage.getItem('autopark_vehicles');
    return saved ? JSON.parse(saved) : initialActiveVehicles;
  });

  const [storeCatalog, setStoreCatalog] = useState<StoreItem[]>(() => {
    const saved = localStorage.getItem('autopark_store');
    return saved ? JSON.parse(saved) : initialStoreItems;
  });

  const [washServices, setWashServices] = useState<CarWashService[]>(() => {
    const saved = localStorage.getItem('autopark_wash_services');
    return saved ? JSON.parse(saved) : initialWashServices;
  });

  const [washOrders, setWashOrders] = useState<WashOrder[]>(() => {
    const saved = localStorage.getItem('autopark_wash_orders');
    return saved ? JSON.parse(saved) : initialWashOrders;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('autopark_bookings');
    return saved ? JSON.parse(saved) : initialBookings;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('autopark_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [nextBoletaNumber, setNextBoletaNumber] = useState<number>(() => {
    const saved = localStorage.getItem('autopark_next_boleta');
    return saved ? parseInt(saved, 10) : 3500;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('autopark_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>(() => {
    const saved = localStorage.getItem('autopark_accounting_entries');
    return saved ? JSON.parse(saved) : [];
  });


  // CRM & Client Portal State
  const [clientRecords, setClientRecords] = useState<VehicleClientRecord[]>(() => {
    const saved = localStorage.getItem('autopark_client_records');
    return saved ? JSON.parse(saved) : initialClientRecords;
  });

  const [clientReviews, setClientReviews] = useState<ClientReview[]>(() => {
    const saved = localStorage.getItem('autopark_client_reviews');
    return saved ? JSON.parse(saved) : initialClientReviews;
  });

  const [currentUser, setCurrentUser] = useState<ClientUser | null>(() => {
    const saved = localStorage.getItem('autopark_client_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Active RBAC User Role and Staff Accounts
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem('autopark_staff_users');
    return saved ? JSON.parse(saved) : initialStaffUsers;
  });
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser>(staffUsers[0] || initialStaffUsers[0]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');

  // Payroll Slips State
  const [payrollSlips, setPayrollSlips] = useState<PayrollSlip[]>(() => {
    const saved = localStorage.getItem('autopark_payroll');
    return saved ? JSON.parse(saved) : initialPayrollSlips;
  });

  const handleSwitchStaffUser = (user: StaffUser) => {
    setCurrentStaffUser(user);
    setCurrentUserRole(user.role);
  };

  const handleAddPayrollSlip = (newSlip: PayrollSlip) => {
    setPayrollSlips((prev) => [newSlip, ...prev]);
    // Also record as Operational Expense in financial reports
    const newExpense: Expense = {
      id: `exp-payroll-${Date.now()}`,
      category: 'sueldos',
      categoryLabel: 'Nómina y Remuneraciones',
      description: `Pago de Remuneración Periodo ${newSlip.period} - ${newSlip.employeeName}`,
      amount: newSlip.netPay,
      date: new Date().toISOString(),
      paymentMethod: newSlip.paymentMethod === 'cheque' ? 'transferencia' : newSlip.paymentMethod,
      registeredBy: currentStaffUser.name,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  // Temporary registration pending verification
  const [pendingUser, setPendingUser] = useState<ClientUser | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('patio');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Modal controls
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [preselectedSpotId, setPreselectedSpotId] = useState<string | undefined>(undefined);
  const [checkoutVehicle, setCheckoutVehicle] = useState<ActiveVehicle | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);

  // Vehicle Management Modals (Edit time & QR Code)
  const [qrVehicle, setQrVehicle] = useState<ActiveVehicle | null>(null);
  const [editTimeVehicle, setEditTimeVehicle] = useState<ActiveVehicle | null>(null);

  // Ticket print view modal
  const [printVehicle, setPrintVehicle] = useState<ActiveVehicle | null>(null);
  const [printTransaction, setPrintTransaction] = useState<Transaction | null>(null);

  // Live Tracker Modal
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);
  const [liveTrackerPlate, setLiveTrackerPlate] = useState('');

  // App Lock Security State (Requires User Login + PIN up to 8 digits)
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('autopark_is_locked');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Check URL params on mount (e.g. ?track_plate=KDJF-84)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const plateParam = params.get('track_plate');
      if (plateParam) {
        setLiveTrackerPlate(plateParam.toUpperCase());
        setIsLiveTrackerOpen(true);
      }
    }
  }, []);

  // Real-time ticking clock for timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Cloud Data from Supabase on Initial Load
  useEffect(() => {
    let isMounted = true;
    async function loadCloudData() {
      const cloud = await fetchAllCloudData();
      if (!cloud || !isMounted) return;

      if (cloud.activeVehicles) setActiveVehicles(cloud.activeVehicles);
      if (cloud.transactions) setTransactions(cloud.transactions);
      if (cloud.washOrders) setWashOrders(cloud.washOrders);
      if (cloud.expenses) setExpenses(cloud.expenses);
      if (cloud.accountingEntries) setAccountingEntries(cloud.accountingEntries);
      if (cloud.spots && cloud.spots.length > 0) setSpots(cloud.spots);
      if (cloud.bookings) setBookings(cloud.bookings);
      if (cloud.storeCatalog && cloud.storeCatalog.length > 0) setStoreCatalog(cloud.storeCatalog);
      if (cloud.staffUsers && cloud.staffUsers.length > 0) setStaffUsers(cloud.staffUsers);
      if (cloud.clientRecords) setClientRecords(cloud.clientRecords);
      if (cloud.clientReviews) setClientReviews(cloud.clientReviews);
    }

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage and Supabase
  useEffect(() => {
    localStorage.setItem('autopark_config', JSON.stringify(rateConfig));
    localStorage.setItem('autopark_app_config', JSON.stringify(appConfig));
    localStorage.setItem('autopark_spots', JSON.stringify(spots));
    localStorage.setItem('autopark_vehicles', JSON.stringify(activeVehicles));
    localStorage.setItem('autopark_store', JSON.stringify(storeCatalog));
    localStorage.setItem('autopark_wash_services', JSON.stringify(washServices));
    localStorage.setItem('autopark_wash_orders', JSON.stringify(washOrders));
    localStorage.setItem('autopark_bookings', JSON.stringify(bookings));
    localStorage.setItem('autopark_transactions', JSON.stringify(transactions));
    localStorage.setItem('autopark_expenses', JSON.stringify(expenses));
    localStorage.setItem('autopark_payroll', JSON.stringify(payrollSlips));
    localStorage.setItem('autopark_accounting_entries', JSON.stringify(accountingEntries));
    localStorage.setItem('autopark_staff_users', JSON.stringify(staffUsers));

    localStorage.setItem('autopark_client_records', JSON.stringify(clientRecords));
    localStorage.setItem('autopark_client_reviews', JSON.stringify(clientReviews));
    if (currentUser) {
      localStorage.setItem('autopark_client_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('autopark_client_user');
    }

    // Sync state changes to Supabase Cloud
    syncSpotsCloud(spots);
    syncStoreCatalogCloud(storeCatalog);
    syncStaffUsersCloud(staffUsers);
    syncClientRecordsCloud(clientRecords);
    syncClientReviewsCloud(clientReviews);
  }, [rateConfig, spots, activeVehicles, storeCatalog, washServices, washOrders, bookings, transactions, expenses, payrollSlips, accountingEntries, staffUsers, clientRecords, clientReviews, currentUser]);



  // Parking Spots CRUD Handlers
  const handleAddSpot = (newSpot: ParkingSpot) => {
    setSpots((prev) => {
      if (prev.some((s) => s.id.toUpperCase() === newSpot.id.toUpperCase())) {
        alert(`El puesto "${newSpot.id}" ya existe.`);
        return prev;
      }
      return [...prev, newSpot];
    });
  };

  const handleUpdateSpot = (updatedSpot: ParkingSpot) => {
    setSpots((prev) => prev.map((s) => (s.id === updatedSpot.id ? updatedSpot : s)));
  };

  const handleDeleteSpot = (spotId: string) => {
    const isOccupied = activeVehicles.some((v) => v.spotId === spotId || v.id === spotId);
    if (isOccupied) {
      alert(`No se puede eliminar el puesto "${spotId}" porque está actualmente ocupado.`);
      return;
    }
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
  };

  const handleSetTotalSpotsCount = (newCount: number) => {
    setSpots((prev) => {
      if (newCount === prev.length) return prev;

      if (newCount > prev.length) {
        const countToAdd = newCount - prev.length;
        const newSpots: ParkingSpot[] = [];
        for (let i = 1; i <= countToAdd; i++) {
          const nextNum = prev.length + i;
          let spotId = `A${nextNum}`;
          if (prev.some((s) => s.id === spotId) || newSpots.some((s) => s.id === spotId)) {
            spotId = `P${nextNum}`;
          }
          newSpots.push({
            id: spotId,
            zone: 'Sector A',
            typeAllowed: ['auto', 'suv', 'camioneta'],
            status: 'disponible',
          });
        }
        return [...prev, ...newSpots];
      } else {
        const countToRemove = prev.length - newCount;
        let removed = 0;
        const updated = [...prev];

        for (let i = updated.length - 1; i >= 0 && removed < countToRemove; i--) {
          const spot = updated[i];
          const isOccupied = activeVehicles.some((v) => v.spotId === spot.id || v.id === spot.currentVehicleId);
          if (spot.status === 'disponible' && !isOccupied) {
            updated.splice(i, 1);
            removed++;
          }
        }

        if (removed < countToRemove) {
          alert(`Se redujeron ${removed} puestos libres. Los puestos ocupados no fueron eliminados para resguardar la seguridad.`);
        }
        return updated;
      }
    });
  };

  // Car Wash Services CRUD Handlers
  const handleAddWashService = (newService: Omit<CarWashService, 'id'>) => {
    const serviceWithId: CarWashService = {
      ...newService,
      id: `w-${Date.now()}`,
    };
    setWashServices((prev) => [...prev, serviceWithId]);
  };

  const handleUpdateWashService = (updatedService: CarWashService) => {
    setWashServices((prev) =>
      prev.map((s) => (s.id === updatedService.id ? updatedService : s))
    );
  };

  const handleDeleteWashService = (serviceId: string) => {
    setWashServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  // Operational Expenses Handler
  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    syncExpenseCloud(newExp);
  };


  // Derived metrics
  const availableSpots = spots.filter((s) => s.status === 'disponible');
  const activeCount = activeVehicles.length;

  const todayIncome = transactions
    .filter((t) => {
      const today = new Date().toISOString().split('T')[0];
      return t.date.startsWith(today);
    })
    .reduce((sum, t) => sum + t.total, 0);

  const lowStockCount = storeCatalog.filter((p) => p.stock <= p.minStock).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const bookingsTodayCount = bookings.filter((b) => b.date === todayStr && b.status === 'confirmada').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'pendiente').length;
  const activeWashOrdersCount = washOrders.filter((w) => w.status !== 'entregado').length;

  // Handlers: Vehicle Entry
  const handleOpenNewEntryWithSpot = (spotId?: string) => {
    setPreselectedSpotId(spotId);
    setIsNewEntryOpen(true);
  };

  const handleSubmitVehicleEntry = (data: {
    plate: string;
    vehicleType: VehicleType;
    make?: string;
    model?: string;
    color?: string;
    spotId: string;
    chargingMode: ChargingMode;
    driverName?: string;
    driverPhone?: string;
    washServiceId?: string;
  }) => {

    const vehicleId = `v-${Date.now()}`;
    const nowIso = new Date().toISOString();

    let washAttachment;
    if (data.washServiceId) {
      const ws = washServices.find((s) => s.id === data.washServiceId);
      if (ws) {
        washAttachment = {
          serviceId: ws.id,
          serviceName: ws.name,
          price: ws.price,
          status: 'pendiente' as WashStatus,
        };

        const newWashOrder: WashOrder = {
          id: `wo-${Date.now()}`,
          plate: data.plate,
          vehicleType: data.vehicleType,
          serviceId: ws.id,
          serviceName: ws.name,
          price: ws.price,
          assignedOperator: 'Asignado en ingreso',
          status: 'pendiente',
          createdAt: nowIso,
          spotId: data.spotId,
        };
        setWashOrders((prev) => [newWashOrder, ...prev]);
      }
    }

    const newVehicle: ActiveVehicle = {
      id: vehicleId,
      plate: data.plate,
      vehicleType: data.vehicleType,
      make: data.make,
      model: data.model,
      color: data.color,
      spotId: data.spotId,
      entryTime: nowIso,
      chargingMode: data.chargingMode,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      attachedStoreItems: [],
      attachedWashService: washAttachment,
    };

    setActiveVehicles((prev) => [...prev, newVehicle]);

    // Sync to Supabase Cloud
    syncActiveVehicleCloud(newVehicle);
    if (washAttachment && data.washServiceId) {
      const ws = washServices.find((s) => s.id === data.washServiceId);
      if (ws) {
        syncWashOrderCloud({
          id: `wo-${Date.now()}`,
          plate: data.plate,
          vehicleType: data.vehicleType,
          serviceId: ws.id,
          serviceName: ws.name,
          price: ws.price,
          assignedOperator: 'Asignado en ingreso',
          status: 'pendiente',
          createdAt: nowIso,
          spotId: data.spotId,
        });
      }
    }

    // Upsert or update vehicle client record in DB

    setClientRecords((prev) => {
      const cleanPlate = data.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const existingIdx = prev.findIndex(
        (cr) => cr.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          clientName: data.driverName || updated[existingIdx].clientName,
          clientPhone: data.driverPhone || updated[existingIdx].clientPhone,
          vehicleType: data.vehicleType,
          make: data.make || updated[existingIdx].make,
          model: data.model || updated[existingIdx].model,
          color: data.color || updated[existingIdx].color,
          updatedAt: nowIso,
        };
        return updated;
      } else {
        const newRecord: VehicleClientRecord = {
          id: `cr-${Date.now()}`,
          plate: data.plate,
          make: data.make || '',
          model: data.model || '',
          color: data.color || '',
          year: new Date().getFullYear(),
          vehicleType: data.vehicleType,
          clientName: data.driverName || 'Cliente Frecuente',
          clientRut: 'S/R',
          clientPhone: data.driverPhone || '',
          clientEmail: '',
          clientAddress: '',
          category: 'normal',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        return [newRecord, ...prev];
      }
    });

    setSpots((prev) =>
      prev.map((s) => (s.id === data.spotId ? { ...s, status: 'ocupado', currentVehicleId: vehicleId } : s))
    );

    setPrintVehicle(newVehicle);
  };

  // Handlers for modifying vehicle entry time or deleting vehicle service
  const handleSaveEntryTime = (vehicleId: string, newEntryTimeIso: string) => {
    setActiveVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const updated = { ...v, entryTime: newEntryTimeIso };
          syncActiveVehicleCloud(updated);
          return updated;
        }
        return v;
      })
    );
  };

  const handleDeleteVehicleService = (vehicle: ActiveVehicle) => {
    if (window.confirm(`¿Está seguro de eliminar el servicio para el vehículo ${vehicle.plate}? Esto liberará el espacio ${vehicle.spotId} sin registrar cobro.`)) {
      setSpots((prev) =>
        prev.map((s) => (s.id === vehicle.spotId ? { ...s, status: 'disponible', currentVehicleId: undefined } : s))
      );
      setActiveVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
      deleteActiveVehicleCloud(vehicle.id);
    }
  };

  // Handlers: Checkout
  const handleConfirmCheckout = (txData: {
    vehicle: ActiveVehicle;
    parkingFee: number;
    storeFee: number;
    washFee: number;
    surchargeFee?: number;
    surchargeReason?: string;
    discount: number;
    total: number;
    amountPaid?: number;
    changeGiven?: number;
    vatAmount?: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
    paymentReference?: string;
    elapsedMinutes: number;
    itemDetails: string[];
  }) => {
    const currentBoleta = nextBoletaNumber;
    setNextBoletaNumber((prev) => {
      const next = prev + 1;
      localStorage.setItem('autopark_next_boleta', next.toString());
      return next;
    });

    const vatCalc = txData.vatAmount ?? Math.round(txData.total - txData.total / 1.19);
    const newTransaction: Transaction = {
      id: `t-${Date.now()}`,
      ticketNumber: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      boletaNumber: currentBoleta,
      date: new Date().toISOString(),
      type: 'mixto',
      plate: txData.vehicle.plate,
      vehicleType: txData.vehicle.vehicleType,
      durationMinutes: txData.elapsedMinutes,
      chargingMode: txData.vehicle.chargingMode,
      parkingFee: txData.parkingFee,
      storeFee: txData.storeFee,
      washFee: txData.washFee,
      surchargeFee: txData.surchargeFee,
      surchargeReason: txData.surchargeReason,
      discount: txData.discount,
      tax: vatCalc,
      total: txData.total,
      amountPaid: txData.amountPaid,
      changeGiven: txData.changeGiven,
      vatAmount: vatCalc,
      paymentMethod: txData.paymentMethod,
      paymentReference: txData.paymentReference,
      itemDetails: txData.itemDetails,
    };

    txData.vehicle.attachedStoreItems.forEach((si) => {
      setStoreCatalog((prev) =>
        prev.map((p) => (p.id === si.item.id ? { ...p, stock: Math.max(0, p.stock - si.quantity) } : p))
      );
    });

    if (txData.vehicle.attachedWashService) {
      setWashOrders((prev) =>
        prev.map((wo) =>
          wo.plate === txData.vehicle.plate && wo.status !== 'entregado'
            ? { ...wo, status: 'entregado', completedAt: new Date().toISOString() }
            : wo
        )
      );
    }

    setSpots((prev) =>
      prev.map((s) => (s.id === txData.vehicle.spotId ? { ...s, status: 'disponible', currentVehicleId: undefined } : s))
    );

    setActiveVehicles((prev) => prev.filter((v) => v.id !== txData.vehicle.id));
    setTransactions((prev) => [newTransaction, ...prev]);
    setPrintTransaction(newTransaction);

    // Sync checkout transaction & remove vehicle from cloud active_vehicles
    syncTransactionCloud(newTransaction);
    deleteActiveVehicleCloud(txData.vehicle.id);
  };


  // Attach store items to vehicle
  const handleUpdateVehicleStoreItems = (
    vehicleId: string,
    items: { item: StoreItem; quantity: number; total: number }[]
  ) => {
    setActiveVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const updated = { ...v, attachedStoreItems: items };
          syncActiveVehicleCloud(updated);
          return updated;
        }
        return v;
      })
    );
  };

  // Quick attach handlers from ParkingGrid
  const handleQuickAttachStore = (vehicle: ActiveVehicle) => {
    setCheckoutVehicle(vehicle);
    setActiveTab('tienda');
  };

  const handleQuickAttachWash = (vehicle: ActiveVehicle) => {
    setActiveTab('lavado');
  };

  // Store standalone sale
  const handleStandaloneSale = (cart: CartItem[], paymentMethod: 'efectivo' | 'tarjeta') => {
    const total = cart.reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0);
    const itemDetails = cart.map((ci) => `${ci.quantity}x ${ci.item.name}`);

    cart.forEach((ci) => {
      setStoreCatalog((prev) =>
        prev.map((p) => (p.id === ci.item.id ? { ...p, stock: Math.max(0, p.stock - ci.quantity) } : p))
      );
    });

    const currentBoleta = nextBoletaNumber;
    setNextBoletaNumber((prev) => {
      const next = prev + 1;
      localStorage.setItem('autopark_next_boleta', next.toString());
      return next;
    });

    const newTx: Transaction = {
      id: `t-${Date.now()}`,
      ticketNumber: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      boletaNumber: currentBoleta,
      date: new Date().toISOString(),
      type: 'tienda',
      parkingFee: 0,
      storeFee: total,
      washFee: 0,
      discount: 0,
      tax: 0,
      total,
      paymentMethod,
      itemDetails,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setPrintTransaction(newTx);
    syncTransactionCloud(newTx);
  };

  // Attach store cart directly to vehicle from Store tab
  const handleAttachCartToVehicle = (vehicleId: string, cart: CartItem[]) => {
    const vehicle = activeVehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    let updatedAttached = [...vehicle.attachedStoreItems];
    cart.forEach((ci) => {
      const idx = updatedAttached.findIndex((i) => i.item.id === ci.item.id);
      if (idx >= 0) {
        const cur = updatedAttached[idx];
        const newQty = cur.quantity + ci.quantity;
        updatedAttached[idx] = { ...cur, quantity: newQty, total: newQty * ci.item.price };
      } else {
        updatedAttached.push({ item: ci.item, quantity: ci.quantity, total: ci.quantity * ci.item.price });
      }
    });

    handleUpdateVehicleStoreItems(vehicleId, updatedAttached);
    setActiveTab('patio');
  };

  // Car wash handlers
  const handleAddWashOrder = (orderData: Omit<WashOrder, 'id' | 'createdAt'>) => {
    const newOrder: WashOrder = {
      ...orderData,
      id: `wo-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWashOrders((prev) => [newOrder, ...prev]);
    syncWashOrderCloud(newOrder);

    if (orderData.spotId) {
      setActiveVehicles((prev) =>
        prev.map((v) => {
          if (v.spotId === orderData.spotId) {
            const updated = {
              ...v,
              attachedWashService: {
                serviceId: orderData.serviceId,
                serviceName: orderData.serviceName,
                price: orderData.price,
                status: 'pendiente' as WashStatus,
              },
            };
            syncActiveVehicleCloud(updated);
            return updated;
          }
          return v;
        })
      );
    }
  };

  const handleUpdateWashStatus = (orderId: string, newStatus: WashStatus) => {
    let updatedOrderObj: WashOrder | null = null;
    setWashOrders((prev) =>
      prev.map((w) => {
        if (w.id === orderId) {
          const updated = { ...w, status: newStatus };
          if (newStatus === 'entregado') updated.completedAt = new Date().toISOString();
          updatedOrderObj = updated;
          return updated;
        }
        return w;
      })
    );

    if (updatedOrderObj) {
      syncWashOrderCloud(updatedOrderObj);
    }

    const targetOrder = washOrders.find((w) => w.id === orderId);
    if (targetOrder) {
      setActiveVehicles((prev) =>
        prev.map((v) => {
          if (v.plate === targetOrder.plate && v.attachedWashService) {
            const updated = {
              ...v,
              attachedWashService: {
                ...v.attachedWashService,
                status: newStatus,
              },
            };
            syncActiveVehicleCloud(updated);
            return updated;
          }
          return v;
        })
      );
    }
  };

  // Agenda / Bookings
  const handleAddBooking = (bookingData: Omit<Booking, 'id'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `b-${Date.now()}`,
    };
    setBookings((prev) => [newBooking, ...prev]);
    syncBookingCloud(newBooking);
  };

  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus) => {
    let updatedBookingObj: Booking | null = null;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = { ...b, status };
          updatedBookingObj = updated;
          return updated;
        }
        return b;
      })
    );

    if (updatedBookingObj) {
      syncBookingCloud(updatedBookingObj);
    }
  };


  const handleConvertBookingToEntry = (booking: Booking) => {
    setActiveTab('patio');
    setIsNewEntryOpen(true);
  };

  // CRM Client Database Handlers
  const handleAddClientRecord = (recordData: Omit<VehicleClientRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRec: VehicleClientRecord = {
      ...recordData,
      id: `cr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setClientRecords((prev) => [newRec, ...prev]);
  };

  const handleUpdateClientRecord = (id: string, updates: Partial<VehicleClientRecord>) => {
    setClientRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
    );
  };

  const handleDeleteClientRecord = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de cliente?')) {
      setClientRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Auth & Client Portal Handlers
  const handleLoginEmail = (email: string, pass: string) => {
    const foundRecord = clientRecords.find((r) => r.clientEmail.toLowerCase() === email.toLowerCase());
    const user: ClientUser = {
      id: foundRecord ? foundRecord.id : `u-${Date.now()}`,
      email: email,
      name: foundRecord ? foundRecord.clientName : email.split('@')[0],
      phone: foundRecord ? foundRecord.clientPhone : '',
      isVerified: true,
      registeredPlates: foundRecord ? [foundRecord.plate] : ['KDJF-84'],
      authProvider: 'email',
    };
    setCurrentUser(user);
  };

  const handleRegisterEmail = (email: string, name: string, pass: string, phone: string) => {
    const newUser: ClientUser = {
      id: `u-${Date.now()}`,
      email,
      name,
      phone,
      isVerified: false,
      registeredPlates: ['AB-1234'],
      authProvider: 'email',
    };
    setPendingUser(newUser);
    return { requiresVerification: true };
  };

  const handleVerifyEmailCode = (code: string) => {
    if (code.trim() === '123456' || code.trim().length === 6) {
      if (pendingUser) {
        const verified = { ...pendingUser, isVerified: true };
        setCurrentUser(verified);
        setPendingUser(null);
        return true;
      } else {
        const defaultVer: ClientUser = {
          id: `u-${Date.now()}`,
          email: 'usuario.verificado@email.com',
          name: 'Usuario Verificado',
          isVerified: true,
          registeredPlates: ['KDJF-84'],
          authProvider: 'email',
        };
        setCurrentUser(defaultVer);
        return true;
      }
    }
    return false;
  };

  const handleLoginGoogle = (googleEmail: string) => {
    const foundRecord = clientRecords.find((r) => r.clientEmail.toLowerCase() === googleEmail.toLowerCase());
    const user: ClientUser = {
      id: `u-g-${Date.now()}`,
      email: googleEmail,
      name: foundRecord ? foundRecord.clientName : googleEmail.split('@')[0],
      isVerified: true,
      registeredPlates: foundRecord ? [foundRecord.plate] : ['KDJF-84'],
      authProvider: 'google',
    };
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddReview = (reviewData: Omit<ClientReview, 'id' | 'createdAt'>) => {
    const newRev: ClientReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClientReviews((prev) => [newRev, ...prev]);

    // If rating is 1 or 2 stars, automatically flag or add internal alert note to client record
    if (reviewData.rating <= 2) {
      setClientRecords((prev) =>
        prev.map((r) =>
          r.plate.toUpperCase() === reviewData.plate.toUpperCase() ||
          (reviewData.clientEmail && r.clientEmail && r.clientEmail.toLowerCase() === reviewData.clientEmail.toLowerCase())
            ? { ...r, category: 'mala_resena', rating: reviewData.rating, reviewNote: reviewData.comment }
            : r
        )

      );
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header Bar */}
      <Header
        activeCount={activeCount}
        totalSpots={spots.length}
        todayIncome={todayIncome}
        config={rateConfig}
        currentUser={currentStaffUser}
        staffUsers={staffUsers}
        onSwitchUser={handleSwitchStaffUser}
        onOpenNewEntry={() => handleOpenNewEntryWithSpot()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
        onOpenLiveTracker={() => {
          setLiveTrackerPlate('');
          setIsLiveTrackerOpen(true);
        }}
        onLockPlatform={() => {
          setIsAppLocked(true);
          localStorage.setItem('autopark_is_locked', 'true');
        }}
        currentTime={currentTime}
      />

      {/* Primary Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        washOrdersCount={activeWashOrdersCount}
        bookingsTodayCount={bookingsTodayCount}
        pendingBookingsCount={pendingBookingsCount}
        lowStockCount={lowStockCount}
        isClientLoggedIn={!!currentUser}
        userRole={currentUserRole}
        onRoleChange={setCurrentUserRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {activeTab === 'patio' && (
          <ParkingGrid
            spots={spots}
            activeVehicles={activeVehicles}
            config={rateConfig}
            onSelectSpotToPark={(spotId) => handleOpenNewEntryWithSpot(spotId)}
            onOpenCheckout={(vehicle) => setCheckoutVehicle(vehicle)}
            onQuickAttachStore={handleQuickAttachStore}
            onQuickAttachWash={handleQuickAttachWash}
            onPrintTicket={(vehicle) => setPrintVehicle(vehicle)}
            onEditEntryTime={(vehicle) => setEditTimeVehicle(vehicle)}
            onDeleteVehicleService={handleDeleteVehicleService}
            onShowQR={(vehicle) => setQrVehicle(vehicle)}
            onOpenLiveTrackerPlate={(plate) => {
              setLiveTrackerPlate(plate);
              setIsLiveTrackerOpen(true);
            }}
            onAddSpot={handleAddSpot}
            onUpdateSpot={handleUpdateSpot}
            onDeleteSpot={handleDeleteSpot}
            onSetTotalSpotsCount={handleSetTotalSpotsCount}
          />
        )}

        {activeTab === 'lavado' && (
          <CarWashSection
            services={washServices}
            washOrders={washOrders}
            activeVehicles={activeVehicles}
            onAddWashOrder={handleAddWashOrder}
            onUpdateWashStatus={handleUpdateWashStatus}
            onAddWashService={handleAddWashService}
            onUpdateWashService={handleUpdateWashService}
            onDeleteWashService={handleDeleteWashService}
          />
        )}

        {activeTab === 'tienda' && (
          <StoreSection
            products={storeCatalog}
            activeVehicles={activeVehicles}
            onAddProduct={(item) =>
              setStoreCatalog((prev) => [...prev, { ...item, id: `p-${Date.now()}` }])
            }
            onUpdateStock={(id, newStock) =>
              setStoreCatalog((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)))
            }
            onStandaloneSale={handleStandaloneSale}
            onAttachToVehicle={handleAttachCartToVehicle}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaSection
            bookings={bookings}
            washServices={washServices}
            onAddBooking={handleAddBooking}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onConvertBookingToEntry={handleConvertBookingToEntry}
          />
        )}

        {activeTab === 'informacion' && (
          <MetricsCrmSection
            clientRecords={clientRecords}
            clientReviews={clientReviews}
            bookings={bookings}
            transactions={transactions}
            activeVehicles={activeVehicles}
            onAddClientRecord={handleAddClientRecord}
            onUpdateClientRecord={handleUpdateClientRecord}
            onDeleteClientRecord={handleDeleteClientRecord}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onConvertBookingToEntry={handleConvertBookingToEntry}
          />
        )}

        {activeTab === 'portal_cliente' && (
          <ClientPortalSection
            currentUser={currentUser}
            activeVehicles={activeVehicles}
            washServices={washServices}
            bookings={bookings}
            reviews={clientReviews}
            onLoginEmail={handleLoginEmail}
            onRegisterEmail={handleRegisterEmail}
            onVerifyEmailCode={handleVerifyEmailCode}
            onLoginGoogle={handleLoginGoogle}
            onLogout={handleLogout}
            onAddClientBooking={handleAddBooking}
            onAddReview={handleAddReview}
            onOpenLiveTrackerPlate={(plate) => {
              setLiveTrackerPlate(plate);
              setIsLiveTrackerOpen(true);
            }}
          />
        )}

        {activeTab === 'caja' && (
          <ReportsSection
            transactions={transactions}
            expenses={expenses}
            onReprintTicket={(tx) => setPrintTransaction(tx)}
            onAddExpense={handleAddExpense}
          />
        )}

        {activeTab === 'contabilidad' && (
          <AccountingSection
            transactions={transactions}
            expenses={expenses}
            payrollSlips={payrollSlips}
            entries={accountingEntries}
            onSaveEntries={(updatedEntries) => {
              setAccountingEntries(updatedEntries);
              updatedEntries.forEach((entry) => syncAccountingEntryCloud(entry));
            }}
          />
        )}


        {activeTab === 'nomina' && (

          <PayrollSection
            staffUsers={staffUsers}
            payrollSlips={payrollSlips}
            onAddPayrollSlip={handleAddPayrollSlip}
          />
        )}

        {activeTab === 'grabado_patente' && (
          <PlateEngravingSection
            activeVehicles={activeVehicles}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0a0a12] border-t border-slate-800/60 text-xs text-slate-500 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <strong className="text-slate-300">AutoPark & Wash Pro v2.5</strong> — Sistema de Gestión Completo
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            Cobro 1º tramo (min 30m): ${rateConfig.firstBlockPrice} • Tramo extra (10m): ${rateConfig.subsequentBlockPrice} • Minuto directo: ${rateConfig.minuteRate}/m
          </span>
        </div>
      </footer>

      {/* Modals */}
      <VehicleEntryModal
        isOpen={isNewEntryOpen}
        onClose={() => setIsNewEntryOpen(false)}
        availableSpots={availableSpots}
        preselectedSpotId={preselectedSpotId}
        config={rateConfig}
        washServices={washServices}
        clientRecords={clientRecords}
        transactions={transactions}
        bookings={bookings}
        onSubmitEntry={handleSubmitVehicleEntry}
      />

      <VehicleCheckoutModal
        vehicle={checkoutVehicle}
        config={rateConfig}
        storeCatalog={storeCatalog}
        onClose={() => setCheckoutVehicle(null)}
        onConfirmCheckout={handleConfirmCheckout}
        onUpdateVehicleStoreItems={handleUpdateVehicleStoreItems}
        onDeleteVehicle={handleDeleteVehicleService}
      />

      <VehicleEditTimeModal
        vehicle={editTimeVehicle}
        config={rateConfig}
        onClose={() => setEditTimeVehicle(null)}
        onSaveEntryTime={handleSaveEntryTime}
      />

      <VehicleQRModal
        vehicle={qrVehicle}
        config={rateConfig}
        onClose={() => setQrVehicle(null)}
        onOpenLiveTrackerPlate={(plate) => {
          setQrVehicle(null);
          setLiveTrackerPlate(plate);
          setIsLiveTrackerOpen(true);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={rateConfig}
        appConfig={appConfig}
        staffUsers={staffUsers}
        onSaveConfig={(newConfig, newAppConfig) => {
          setRateConfig(newConfig);
          if (newAppConfig) {
            setAppConfig(newAppConfig);
          }
        }}
        onUpdateStaffUsers={(updatedUsers) => setStaffUsers(updatedUsers)}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        transactions={transactions}
        expenses={expenses}
        accountingEntries={accountingEntries}
        activeVehicles={activeVehicles}
      />

      <TicketPrintModal
        vehicle={printVehicle}
        transaction={printTransaction}
        printerConfig={appConfig.printer58mm}
        appTitle={appConfig.appTitle}
        logoUrl={appConfig.logoUrl}
        onClose={() => {
          setPrintVehicle(null);
          setPrintTransaction(null);
        }}
      />

      <LiveVehicleTrackerModal
        isOpen={isLiveTrackerOpen}
        onClose={() => setIsLiveTrackerOpen(false)}
        initialPlate={liveTrackerPlate}
        activeVehicles={activeVehicles}
        washOrders={washOrders}
        spots={spots}
        rateConfig={rateConfig}
        washServices={washServices}
      />

      <LockOverlayModal
        isLocked={isAppLocked}
        staffUsers={staffUsers}
        currentStaffUser={currentStaffUser}
        appConfig={appConfig}
        onUnlock={(authenticatedUser) => {
          setCurrentStaffUser(authenticatedUser);
          setCurrentUserRole(authenticatedUser.role);
          setIsAppLocked(false);
          localStorage.setItem('autopark_is_locked', 'false');
        }}
      />

    </div>
  );
}
