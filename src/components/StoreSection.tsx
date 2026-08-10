import React, { useState, useEffect, useRef } from 'react';
import { ActiveVehicle, CartItem, StoreCategory, StoreItem, WeightUnit } from '../types';
import { formatCurrency } from '../utils/pricing';
import { AlertTriangle, Car, Check, Edit, Plus, Search, ShoppingBag, ShoppingCart, Trash2, X, Package, QrCode, Wifi, CheckCircle, Zap } from 'lucide-react';

interface StoreSectionProps {
  products: StoreItem[];
  activeVehicles: ActiveVehicle[];
  onAddProduct: (item: Omit<StoreItem, 'id'>) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onStandaloneSale: (cart: CartItem[], paymentMethod: 'efectivo' | 'tarjeta') => void;
  onAttachToVehicle: (vehicleId: string, cart: CartItem[]) => void;
}

const categories: { id: StoreCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas las Categorías' },
  { id: 'bebidas', label: '🥤 Bebidas' },
  { id: 'snacks', label: '🍫 Snacks' },
  { id: 'limpieza', label: '🧹 Limpieza & Auto' },
  { id: 'aceites', label: '🛢️ Aceites & Líquidos' },
  { id: 'accesorios', label: '🔌 Accesorios' },
];

export const StoreSection: React.FC<StoreSectionProps> = ({
  products,
  activeVehicles,
  onAddProduct,
  onUpdateStock,
  onStandaloneSale,
  onAttachToVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'inventario'>('catalogo');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StoreCategory | 'todas'>('todas');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Scanner status & buffer
  const [scannerConnected, setScannerConnected] = useState(true);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);

  // New product form state with comprehensive specs
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<StoreCategory>('bebidas');
  const [newProdPrice, setNewProdPrice] = useState<number>(1000);
  const [newProdStock, setNewProdStock] = useState<number>(10);
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdModel, setNewProdModel] = useState('');
  const [newProdWeight, setNewProdWeight] = useState<number | undefined>(undefined);
  const [newProdWeightUnit, setNewProdWeightUnit] = useState<WeightUnit>('ml');
  const [newProdIsOnSale, setNewProdIsOnSale] = useState(false);
  const [newProdDiscountPercent, setNewProdDiscountPercent] = useState<number>(15);

  // Handle scanned barcode lookups
  const processScannedBarcode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    const matchedProduct = products.find(
      (p) =>
        (p.barcode && p.barcode.toUpperCase() === cleanCode) ||
        p.code.toUpperCase() === cleanCode
    );

    if (matchedProduct) {
      if (matchedProduct.stock > 0) {
        handleAddToCart(matchedProduct);
        setScanMessage(`✅ Escaneado: ${matchedProduct.name} (+1 al carrito)`);
      } else {
        setScanMessage(`⚠️ Producto sin Stock: ${matchedProduct.name}`);
      }
    } else {
      setScanMessage(`❌ Código no registrado: "${cleanCode}"`);
    }

    setTimeout(() => {
      setScanMessage(null);
    }, 4000);
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScannedBarcode(barcodeInput);
    setBarcodeInput('');
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'todas' && p.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.model && p.model.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const handleAddToCart = (product: StoreItem) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.item.id === product.id);
      if (idx >= 0) {
        const existing = prev[idx];
        if (existing.quantity >= product.stock) return prev;
        const updated = [...prev];
        updated[idx] = { ...existing, quantity: existing.quantity + 1 };
        return updated;
      }
      return [...prev, { item: product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== productId));
  };

  const getItemUnitPrice = (item: StoreItem) => {
    if (item.isOnSale && item.salePrice) return item.salePrice;
    if (item.isOnSale && item.discountPercent) {
      return Math.round(item.price * (1 - item.discountPercent / 100));
    }
    return item.price;
  };

  const cartTotal = cart.reduce((acc, ci) => acc + getItemUnitPrice(ci.item) * ci.quantity, 0);

  const handleCheckoutStandalone = (paymentMethod: 'efectivo' | 'tarjeta') => {
    if (cart.length === 0) return;
    onStandaloneSale(cart, paymentMethod);
    setCart([]);
  };

  const handleAttachToVehicle = () => {
    if (cart.length === 0 || !selectedVehicleId) return;
    onAttachToVehicle(selectedVehicleId, cart);
    setCart([]);
    setSelectedVehicleId('');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const calculatedSalePrice = newProdIsOnSale
      ? Math.round(newProdPrice * (1 - newProdDiscountPercent / 100))
      : undefined;

    onAddProduct({
      name: newProdName.trim(),
      category: newProdCategory,
      price: newProdPrice,
      stock: newProdStock,
      minStock: 3,
      code: newProdCode.trim().toUpperCase() || `ART-${Math.floor(Math.random() * 1000)}`,
      barcode: newProdBarcode.trim() || undefined,
      brand: newProdBrand.trim() || undefined,
      model: newProdModel.trim() || undefined,
      weightValue: newProdWeight,
      weightUnit: newProdWeightUnit,
      isOnSale: newProdIsOnSale,
      discountPercent: newProdIsOnSale ? newProdDiscountPercent : undefined,
      salePrice: calculatedSalePrice,
    });

    setIsNewProductOpen(false);
    setNewProdName('');
    setNewProdCode('');
    setNewProdBarcode('');
    setNewProdBrand('');
    setNewProdModel('');
    setNewProdWeight(undefined);
    setNewProdIsOnSale(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner, Barcode Scanner Status & Controls */}
      <div className="bg-[#0d0d1a] p-5 rounded-3xl border border-slate-800/60 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              Tienda POS & Control de Inventario
            </h2>
            <p className="text-xs text-slate-400">Venta POS, scanner láser/Bluetooth QR y carga a ticket de vehículo.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Barcode Scanner Connection Indicator */}
            <div className="bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Lector Laser/Bluetooth Activo</span>
            </div>

            {lowStockCount > 0 && (
              <div className="bg-amber-950/60 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{lowStockCount} stock bajo</span>
              </div>
            )}

            <div className="bg-[#111122] p-1 rounded-xl flex items-center gap-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('catalogo')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'catalogo' ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Venta POS / Catalogo
              </button>
              <button
                onClick={() => setActiveTab('inventario')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'inventario' ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Inventario Completo
              </button>
            </div>
          </div>
        </div>

        {/* Barcode Quick Reader Bar */}
        <div className="bg-[#111122] p-3 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleManualScanSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Escanea o escribe código de barras (EAN/SKU) aquí..."
                className="w-full bg-[#090914] border border-slate-700/80 text-amber-300 font-mono text-xs rounded-xl py-2 pl-9 pr-3 outline-hidden focus:border-amber-400 placeholder:text-slate-500 font-bold"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buscar / Escanear</span>
            </button>
          </form>

          {/* Preset Barcode Simulators */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full text-[10px] shrink-0">
            <span className="text-slate-400 font-bold mr-1">Probar lector:</span>
            {products.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => processScannedBarcode(p.barcode || p.code)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg font-mono cursor-pointer transition-colors"
                title={`Simular lectura de ${p.name}`}
              >
                {p.barcode || p.code}
              </button>
            ))}
          </div>
        </div>

        {/* Scan Toast Message Notification */}
        {scanMessage && (
          <div className="bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs px-4 py-2 rounded-xl font-bold flex items-center justify-between animate-fade-in shadow-md">
            <span>{scanMessage}</span>
            <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'catalogo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Product Search & Grid (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, SKU, código de barra, marca o modelo..."
                  className="w-full bg-[#0d0d1a] border border-slate-800/80 text-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium outline-hidden focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="bg-[#0d0d1a] border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 outline-hidden focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0d0d1a] text-slate-200">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddToCart(p)}
                    className={`bg-[#0d0d1a] rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] shadow-lg shadow-black/20 ${
                      isOutOfStock
                        ? 'opacity-40 border-slate-800 bg-[#07070d] cursor-not-allowed'
                        : 'border-slate-800/80 hover:border-amber-500/50 hover:bg-[#111122]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold mb-1">
                        <span>{p.barcode || p.code}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${p.stock <= p.minStock ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300'}`}>
                          Stock: {p.stock}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-100 line-clamp-1">{p.name}</h4>
                      
                      {(p.brand || p.model) && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                          {[p.brand, p.model].filter(Boolean).join(' - ')}
                        </p>
                      )}

                      {p.weight && (
                        <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                          {p.weight} {p.weightUnit}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-emerald-400">{formatCurrency(p.price)}</span>
                      <button
                        disabled={isOutOfStock}
                        className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-500/30 hover:bg-amber-600 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: POS Cart / Attach Panel */}
          <div className="bg-[#0d0d1a] p-5 rounded-3xl border border-slate-800/60 shadow-xl shadow-black/20 space-y-4 flex flex-col justify-between h-fit">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-400" /> Carrito de Venta
                </h3>
                <span className="text-xs bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                  {cart.length} ítems
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  Escanee un código de barra o haga clic en un producto para añadirlo al carrito.
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {cart.map((ci) => (
                    <div key={ci.item.id} className="flex items-center justify-between text-xs bg-[#111122] p-2.5 rounded-xl border border-slate-800/60">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-slate-200">{ci.item.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{ci.quantity}x {formatCurrency(ci.item.price)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-400">{formatCurrency(ci.item.price * ci.quantity)}</span>
                        <button onClick={() => handleRemoveFromCart(ci.item.id)} className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-base font-black text-slate-100">
                  <span>Total Carrito:</span>
                  <span className="text-xl text-emerald-400 font-mono">{formatCurrency(cartTotal)}</span>
                </div>

                {/* Option 1: Attach to Vehicle */}
                <div className="bg-indigo-950/40 p-3 rounded-2xl border border-indigo-500/30 space-y-2">
                  <label className="block text-[11px] font-bold text-indigo-300 uppercase">
                    Cargar a Patente Estacionada
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-[#111122] border border-indigo-500/40 rounded-xl p-2 text-xs font-bold text-slate-200 outline-hidden focus:border-indigo-400"
                  >
                    <option value="">-- Seleccionar Vehículo --</option>
                    {activeVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - Espacio {v.spotId}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAttachToVehicle}
                    disabled={!selectedVehicleId}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 shadow-md shadow-indigo-900/40"
                  >
                    <Car className="w-4 h-4" />
                    <span>Cargar a Ticket de Estacionamiento</span>
                  </button>
                </div>

                {/* Option 2: Standalone Direct Sale */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCheckoutStandalone('efectivo')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    💵 Venta Efectivo
                  </button>
                  <button
                    onClick={() => handleCheckoutStandalone('tarjeta')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    💳 Venta Tarjeta
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      ) : (
        /* Inventory Management Tab */
        <div className="bg-[#0d0d1a] p-6 rounded-3xl border border-slate-800/60 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" /> Control de Stock & Ficha Técnica de Productos
            </h3>
            <button
              onClick={() => setIsNewProductOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Artículo con SKU / Barra</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#111122] text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-3">SKU / Barra</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Marca / Modelo</th>
                  <th className="py-3 px-3">Peso / Vol</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Precio</th>
                  <th className="py-3 px-3">Stock Actual</th>
                  <th className="py-3 px-3 text-right">Ajuste Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#111122]">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{p.barcode || p.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-200">{p.name}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {[p.brand, p.model].filter(Boolean).join(' ') || '---'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {p.weight ? `${p.weight} ${p.weightUnit || 'g'}` : '---'}
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-400">{p.category}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-emerald-400">{formatCurrency(p.price)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold font-mono ${p.stock <= p.minStock ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'}`}>
                        {p.stock} un.
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => onUpdateStock(p.id, p.stock + 5)}
                          className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30 font-bold cursor-pointer"
                        >
                          +5
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Product Modal with Barcode, Brand, Model, Weight */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d0d1a] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" /> Registrar Producto en Inventario
              </h3>
              <button onClick={() => setIsNewProductOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej: Aceite Sintético Mobil 1 5W-30 1L"
                  className="w-full bg-[#111122] border border-slate-700/60 text-white rounded-xl p-2.5 font-bold outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Código de Barra / SKU (EAN-13)</label>
                  <input
                    type="text"
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    placeholder="7801234567890"
                    className="w-full bg-[#111122] border border-slate-700/60 text-amber-300 font-mono rounded-xl p-2.5 outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Código Interno</label>
                  <input
                    type="text"
                    value={newProdCode}
                    onChange={(e) => setNewProdCode(e.target.value)}
                    placeholder="ACE-5W30"
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-300 font-mono rounded-xl p-2.5 outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    placeholder="Ej: Mobil, Coca Cola"
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Modelo / Variante</label>
                  <input
                    type="text"
                    value={newProdModel}
                    onChange={(e) => setNewProdModel(e.target.value)}
                    placeholder="Ej: 5W-30 Full Synthetic"
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">Peso / Contenido Neto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdWeight || ''}
                    onChange={(e) => setNewProdWeight(parseFloat(e.target.value) || undefined)}
                    placeholder="Ej: 500, 1, 2.5"
                    className="w-full bg-[#111122] border border-slate-700/60 text-white rounded-xl p-2.5 outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Unidad</label>
                  <select
                    value={newProdWeightUnit}
                    onChange={(e) => setNewProdWeightUnit(e.target.value as WeightUnit)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 font-bold outline-hidden focus:border-amber-500"
                  >
                    <option value="ml">Mililitros (ml)</option>
                    <option value="l">Litros (L)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilos (kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as StoreCategory)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-slate-200 rounded-xl p-2.5 font-bold outline-hidden focus:border-amber-500"
                  >
                    <option value="bebidas">Bebidas</option>
                    <option value="snacks">Snacks</option>
                    <option value="limpieza">Limpieza</option>
                    <option value="aceites">Aceites</option>
                    <option value="accesorios">Accesorios</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Precio ($ CLP) *</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111122] border border-slate-700/60 text-white rounded-xl p-2.5 font-bold outline-hidden focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Stock Inicial *</label>
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700/60 text-white rounded-xl p-2.5 font-bold outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold cursor-pointer hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold cursor-pointer hover:bg-amber-500 shadow-md"
                >
                  Guardar Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

