import React, { useState, useRef } from 'react';
import { ActiveVehicle, AppConfig } from '../types';
import { Printer, Copy, Sparkles, RefreshCw, Eye, Download, FileText, CheckCircle2, RotateCcw, Image as ImageIcon, Sliders, Settings2, Car, ZoomIn, ZoomOut, FlipHorizontal } from 'lucide-react';

interface PlateEngravingSectionProps {
  activeVehicles?: ActiveVehicle[];
  appConfig?: AppConfig;
}

export const CAR_BRANDS = [
  { name: 'Toyota', logoText: 'TOYOTA' },
  { name: 'Chevrolet', logoText: 'CHEVROLET' },
  { name: 'Nissan', logoText: 'NISSAN' },
  { name: 'Hyundai', logoText: 'HYUNDAI' },
  { name: 'Kia', logoText: 'KIA' },
  { name: 'Ford', logoText: 'FORD' },
  { name: 'Peugeot', logoText: 'PEUGEOT' },
  { name: 'Honda', logoText: 'HONDA' },
  { name: 'Suzuki', logoText: 'SUZUKI' },
  { name: 'Volkswagen', logoText: 'VOLKSWAGEN' },
  { name: 'BMW', logoText: 'BMW' },
  { name: 'Mercedes-Benz', logoText: 'MERCEDES-BENZ' },
  { name: 'Jeep', logoText: 'JEEP' },
  { name: 'Mazda', logoText: 'MAZDA' },
  { name: 'Subaru', logoText: 'SUBARU' },
  { name: 'Renault', logoText: 'RENAULT' },
  { name: 'Chery', logoText: 'CHERY' },
  { name: 'MG', logoText: 'MG' },
  { name: 'Mitsubishi', logoText: 'MITSUBISHI' },
];

export const PlateEngravingSection: React.FC<PlateEngravingSectionProps> = ({
  activeVehicles = [],
  appConfig,
}) => {
  // Main Engraving Configuration State
  const [plateText, setPlateText] = useState<string>('AB CD 12');
  const [fontFamily, setFontFamily] = useState<'FE-Schrift' | 'Arial' | 'Monospace'>('FE-Schrift');
  const [isMirror, setIsMirror] = useState<boolean>(false);
  const [copies, setCopies] = useState<number>(6); // 1 to 12
  
  // Thermal Printer Margins (mm)
  const [marginTop, setMarginTop] = useState<number>(2);
  const [marginBottom, setMarginBottom] = useState<number>(2);
  const [marginLeft, setMarginLeft] = useState<number>(2);
  const [marginRight, setMarginRight] = useState<number>(2);

  // Typography & Density
  const [fontSize, setFontSize] = useState<number>(24); // px
  const [density, setDensity] = useState<number>(200); // 100% to 300% (contrast / thickness)

  // Logo Settings
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('Toyota');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(24); // px
  const [spacingLogoPlate, setSpacingLogoPlate] = useState<number>(10); // px

  // Notification Toast
  const [showPrintToast, setShowPrintToast] = useState(false);

  // Handle custom logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomLogoUrl(event.target?.result as string);
        setSelectedBrand('Custom');
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset to default settings
  const handleReset = () => {
    setPlateText('AB CD 12');
    setFontFamily('FE-Schrift');
    setIsMirror(false);
    setCopies(6);
    setMarginTop(2);
    setMarginBottom(2);
    setMarginLeft(2);
    setMarginRight(2);
    setFontSize(24);
    setDensity(200);
    setShowLogo(true);
    setSelectedBrand('Toyota');
    setCustomLogoUrl('');
    setLogoSize(24);
    setSpacingLogoPlate(10);
  };

  // Quick select plate from patio vehicle
  const handleSelectPatioVehicle = (v: ActiveVehicle) => {
    setPlateText(v.plate.toUpperCase());
    if (v.driverName) {
      // Try to detect brand from driver notes or default to Toyota
      const found = CAR_BRANDS.find((b) => v.driverName?.toLowerCase().includes(b.name.toLowerCase()));
      if (found) {
        setSelectedBrand(found.name);
      }
    }
  };

  // Trigger thermal PDF print window (58mm)
  const handlePrint58mmPDF = () => {
    setShowPrintToast(true);
    setTimeout(() => setShowPrintToast(false), 3000);

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    // Font styling calculation
    const fontCSS =
      fontFamily === 'FE-Schrift'
        ? "font-family: 'Courier New', 'Consolas', monospace; letter-spacing: 0.15em; font-weight: 900; text-transform: uppercase;"
        : fontFamily === 'Monospace'
        ? "font-family: 'Courier New', monospace; font-weight: 800; letter-spacing: 0.05em;"
        : "font-family: Arial, Helvetica, sans-serif; font-weight: 900; letter-spacing: 0.05em;";

    const mirrorCSS = isMirror ? 'transform: scaleX(-1); display: inline-block;' : '';

    // Generate N copies HTML (pure design only without borders or extra text)
    let copiesHTML = '';
    for (let i = 1; i <= copies; i++) {
      copiesHTML += `
        <div class="ticket-item" style="
          width: 50mm;
          height: 30mm;
          background: #ffffff;
          border: none;
          box-sizing: border-box;
          margin: 0 auto 2mm auto;
          padding: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          page-break-inside: avoid;
          overflow: hidden;
        ">
          ${
            showLogo
              ? `
            <div style="margin-bottom: ${spacingLogoPlate}px; text-align: center;">
              ${
                customLogoUrl && selectedBrand === 'Custom'
                  ? `<img src="${customLogoUrl}" style="height: ${logoSize}px; max-width: 45mm; object-fit: contain; ${
                      isMirror ? 'transform: scaleX(-1);' : ''
                    }" />`
                  : `<div style="font-size: ${Math.max(10, logoSize * 0.55)}px; font-weight: 900; font-family: sans-serif; letter-spacing: 0.1em; ${
                      isMirror ? 'transform: scaleX(-1);' : ''
                    }">${selectedBrand.toUpperCase()}</div>`
              }
            </div>
            `
              : ''
          }
          <div style="
            font-size: ${fontSize}px;
            color: #000000;
            line-height: 1;
            text-align: center;
            filter: contrast(${density}%);
            ${fontCSS}
            ${mirrorCSS}
          ">
            ${plateText || 'AB CD 12'}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grabado de Patente - ${plateText}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              width: 58mm;
              margin: 0 auto;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: sans-serif;
              -webkit-print-color-adjust: exact;
            }
            @media print {
              .no-print { display: none !important; }
              body { width: 58mm; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; padding: 10px; background: #1e1e2e; color: #fff;">
            <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
              🖨️ Imprimir PDF Térmico (58mm)
            </button>
          </div>
          ${copiesHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* Banner de Título */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
            <Printer className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">Módulo de Grabado de Patente</h1>
              <span className="bg-indigo-950 text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/40 uppercase">
                Impresión Térmica 58mm / Plantillas de Vidrio
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Configuración de tipografía FE-Schrift, modo espejo, copias múltiples, márgenes, densidad y logos de marca.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Opciones</span>
          </button>

          <button
            onClick={handlePrint58mmPDF}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-950/80 border border-indigo-400/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket PDF (58mm)</span>
          </button>
        </div>
      </div>

      {showPrintToast && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">
            ¡Documento de grabado generado en formato PDF 58mm con {copies} copia(s)! Se ha abierto la ventana de impresión térmica.
          </span>
        </div>
      )}

      {/* Main Grid: Visual Canvas Box (5cm x 3cm) & Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Visual Preview (5cm x 3cm) + Patio Fast Pickers (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CUADRO BLANCO DE 5 CM ANCHO POR 3 CM ALTO (REQUERIMIENTO EXACTO DEL USUARIO) */}
          <div className="bg-[#0d0d1a] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-400" />
                Previsualización Escala Real (5 cm × 3 cm)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/50">
                Fondo Blanco Térmico
              </span>
            </div>

            {/* Indicator label */}
            <p className="text-[11px] text-slate-400">
              Vista del elemento a imprimir en el cuadro de <strong>5 cm de ancho por 3 cm de alto</strong>:
            </p>

            {/* CONTAINER VISUAL DE 5 CM x 3 CM (189px x 113px exactos a escala física estándar) */}
            <div className="flex flex-col items-center justify-center my-4">
              <div
                className="bg-white text-black shadow-2xl relative transition-all duration-150 flex flex-col items-center justify-center overflow-hidden border-2 border-slate-400"
                style={{
                  width: '189px', // 5 cm approx at 96dpi screen resolution
                  height: '113px', // 3 cm approx at 96dpi screen resolution
                  paddingTop: `${marginTop}px`,
                  paddingBottom: `${marginBottom}px`,
                  paddingLeft: `${marginLeft}px`,
                  paddingRight: `${marginRight}px`,
                  boxSizing: 'border-box',
                  filter: `contrast(${density}%)`,
                }}
              >
                {/* Logo Optional */}
                {showLogo && (
                  <div
                    style={{
                      marginBottom: `${spacingLogoPlate}px`,
                      textAlign: 'center',
                    }}
                  >
                    {customLogoUrl && selectedBrand === 'Custom' ? (
                      <img
                        src={customLogoUrl}
                        alt="Logo Marca"
                        className={`object-contain transition-transform ${isMirror ? 'scale-x-[-1]' : ''}`}
                        style={{ height: `${Math.min(30, logoSize * 0.7)}px`, maxWidth: '160px' }}
                      />
                    ) : (
                      <div
                        className={`font-black tracking-widest text-[10px] border-b-2 border-black pb-0.5 leading-none transition-transform ${
                          isMirror ? 'scale-x-[-1]' : ''
                        }`}
                        style={{ fontSize: `${Math.max(8, logoSize * 0.45)}px` }}
                      >
                        {selectedBrand.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Plate Text */}
                <div
                  className={`leading-none select-none transition-all ${
                    fontFamily === 'FE-Schrift'
                      ? 'font-mono font-black tracking-widest uppercase'
                      : fontFamily === 'Monospace'
                      ? 'font-mono font-bold tracking-wider'
                      : 'font-sans font-black tracking-wider'
                  } ${isMirror ? 'scale-x-[-1]' : ''}`}
                  style={{
                    fontSize: `${Math.min(28, fontSize * 0.75)}px`,
                    color: '#000000',
                    fontWeight: 900,
                  }}
                >
                  {plateText || 'AB CD 12'}
                </div>

                {/* Espejo Watermark Label if enabled */}
                {isMirror && (
                  <span className="absolute bottom-1 right-1 text-[7px] text-rose-600 font-bold bg-rose-100 px-1 rounded uppercase">
                    ESPEJO
                  </span>
                )}
              </div>

              {/* Dimensional Specs Legend */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-2">
                <span>📐 Ancho: 5 cm (50 mm)</span>
                <span>•</span>
                <span>Alto: 3 cm (30 mm)</span>
              </div>
            </div>

            {/* Quick Mirror Toggle Button under visual box */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Efecto Invertido (Modo Espejo)</span>
              <button
                type="button"
                onClick={() => setIsMirror(!isMirror)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isMirror
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>{isMirror ? 'ACTIVADO (Invertido)' : 'Normal'}</span>
              </button>
            </div>
          </div>

          {/* Cargar Patente desde Patio Activo */}
          <div className="bg-[#0d0d1a] border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-indigo-400" />
              Cargar Patente desde Vehículos en Patio ({activeVehicles.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Haga clic en un vehículo estacionado para cargar su patente y marca automáticamente:
            </p>

            {activeVehicles.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs bg-[#070712] rounded-2xl border border-slate-800/80">
                No hay vehículos en patio de estacionamiento actualmente.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {activeVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectPatioVehicle(v)}
                    className="bg-[#070712] hover:bg-indigo-950 text-slate-200 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/50 p-2 rounded-xl text-xs text-left transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                      {v.plate}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {v.vehicleType}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Full Configuration Controls Panel (7 cols) */}
        <div className="lg:col-span-7 bg-[#0d0d1a] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              Ajustes de Impresión Térmica 58mm
            </h2>
            <span className="text-xs font-mono text-indigo-300 font-bold">58mm Continuous Ticket</span>
          </div>

          {/* 1. TEXTO DE LA PATENTE Y TIPOGRAFÍA */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Texto de la Patente
                </label>
                <input
                  type="text"
                  value={plateText}
                  onChange={(e) => setPlateText(e.target.value.toUpperCase())}
                  placeholder="Ej: AB CD 12"
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-black text-amber-300 uppercase tracking-widest outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Tipografía (Estilo de Letra)
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-indigo-500"
                >
                  <option value="FE-Schrift">🇩🇪 FE-Schrift (Patente Oficial Chile / Alemana)</option>
                  <option value="Arial">🔤 Arial (Estándar Limpia)</option>
                  <option value="Monospace">🖥️ Monospace (Courier / Consolas)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. COPIAS (HASTA 12) Y MODO ESPEJO */}
          <div className="bg-[#070712] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Cantidad de Copias</span>
                  <span className="text-indigo-400 font-mono font-black text-xs">{copies} Copia(s)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono text-white w-6 text-center">{copies}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {[2, 4, 6, 8, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCopies(num)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        copies === num
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {num} copias
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Orientación Espejo (Vidrios Interiores)
                </label>
                <button
                  type="button"
                  onClick={() => setIsMirror(!isMirror)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                    isMirror
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                      : 'bg-[#111122] text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4 text-amber-400" />
                  <span>{isMirror ? 'Modo Espejo ACTIVO (Texto Invertido)' : 'Texto Normal (Sin Invertir)'}</span>
                </button>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Requerido para plantillas de grabado ácido aplicadas desde el interior del vehículo.
                </span>
              </div>
            </div>
          </div>

          {/* 3. TAMAÑO TIPOGRAFÍA Y DENSIDAD / OSCURIDAD TÉRMICA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                <span>Tamaño de Tipografía</span>
                <span className="font-mono text-indigo-400 font-bold">{fontSize} px</span>
              </label>
              <input
                type="range"
                min={12}
                max={42}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 24)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                <span>Densidad / Oscuridad Térmica</span>
                <span className="font-mono text-emerald-400 font-bold">{density}%</span>
              </label>
              <input
                type="range"
                min={100}
                max={300}
                step={10}
                value={density}
                onChange={(e) => setDensity(parseInt(e.target.value) || 200)}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. MARGENES DE LA IMPRESORA TÉRMICA */}
          <div className="bg-[#070712] p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block border-b border-slate-800 pb-1.5">
              Ajuste de Márgenes del Ticket (mm)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Superior (mm)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={marginTop}
                  onChange={(e) => setMarginTop(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-lg p-1 text-center font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Inferior (mm)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={marginBottom}
                  onChange={(e) => setMarginBottom(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-lg p-1 text-center font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Izquierdo (mm)</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={marginLeft}
                  onChange={(e) => setMarginLeft(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-lg p-1 text-center font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Derecho (mm)</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={marginRight}
                  onChange={(e) => setMarginRight(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111122] border border-slate-700 rounded-lg p-1 text-center font-bold text-white"
                />
              </div>
            </div>
          </div>

          {/* 5. LOGO DE LA MARCA DEL VEHÍCULO & SEPARACIÓN */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Logo de Marca del Vehículo
              </span>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {showLogo ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>

            {showLogo && (
              <div className="bg-[#070712] p-4 rounded-2xl border border-slate-800 space-y-4">
                
                {/* Brand Selector + Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Seleccionar Marca de Auto
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-[#111122] border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-white outline-hidden"
                    >
                      {CAR_BRANDS.map((b) => (
                        <option key={b.name} value={b.name}>
                          🚘 {b.name}
                        </option>
                      ))}
                      <option value="Custom">📁 Cargar Logo Personalizado (Archivo Image)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Subir Logo de Marca Custom
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full bg-[#111122] border border-slate-700 rounded-xl p-1 text-xs text-slate-300 cursor-pointer file:bg-indigo-600 file:border-0 file:rounded-lg file:text-white file:text-[10px] file:font-bold file:px-2 file:py-1 hover:file:bg-indigo-500"
                    />
                  </div>
                </div>

                {/* Adjust Size of Logo & Spacing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Tamaño del Logo</span>
                      <span className="font-mono text-indigo-400 font-bold">{logoSize} px</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      value={logoSize}
                      onChange={(e) => setLogoSize(parseInt(e.target.value) || 20)}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Espacio entre Patente y Logo</span>
                      <span className="font-mono text-indigo-400 font-bold">{spacingLogoPlate} px</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={spacingLogoPlate}
                      onChange={(e) => setSpacingLogoPlate(parseInt(e.target.value) || 0)}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handlePrint58mmPDF}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-950/80 border border-indigo-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-5 h-5" />
              <span>Generar e Imprimir Ticket 58mm ({copies} Copia(s))</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
