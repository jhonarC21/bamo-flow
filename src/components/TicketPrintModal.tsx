import React, { useRef, useState } from 'react';
import { ActiveVehicle, Transaction, Printer58mmConfig } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';
import { Printer, X, Download, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TicketPrintModalProps {
  vehicle?: ActiveVehicle | null;
  transaction?: Transaction | null;
  printerConfig?: Printer58mmConfig;
  appTitle?: string;
  logoUrl?: string;
  onClose: () => void;
}

export const TicketPrintModal: React.FC<TicketPrintModalProps> = ({
  vehicle,
  transaction,
  printerConfig,
  appTitle,
  logoUrl,
  onClose,
}) => {
  if (!vehicle && !transaction) return null;

  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isEntryTicket = !!vehicle;
  const ticketNumber = transaction ? transaction.ticketNumber : `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = transaction ? formatDateTime(transaction.date) : formatDateTime(new Date().toISOString());
  const plate = vehicle ? vehicle.plate : transaction?.plate || 'S/I';

  const headerText = printerConfig?.headerText || 'Bamo garage spa';
  const companyRut = printerConfig?.companyRut || '78.084.649-6';
  const companyAddress = printerConfig?.companyAddress || 'Cobija 2058';
  const companySii = printerConfig?.companySii || 'SII CALAMA';
  const footerText = printerConfig?.footerText || '¡Gracias por su preferencia! Conserve este comprobante.';
  const showQr = printerConfig?.showQr ?? true;
  const fontSizePx = printerConfig?.fontSizePx || 11;
  const showTicketLogo = printerConfig?.showLogo ?? true;
  const ticketLogo = printerConfig?.logoUrl || logoUrl;
  const featuredText = printerConfig?.featuredText;

  // Calculate VAT breakdown if transaction
  const vatAmt = transaction?.vatAmount ?? (transaction ? Math.round(transaction.total - transaction.total / 1.19) : 0);
  const netAmt = transaction ? transaction.total - vatAmt : 0;
  const paidAmt = transaction?.amountPaid ?? (transaction ? transaction.total : 0);
  const changeAmt = transaction?.changeGiven ?? 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    try {
      setDownloadingPdf(true);
      const element = ticketRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // High density rendering for crisp text on thermal printers
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Replace any oklch(...) color definitions in style tags to prevent html2canvas crash
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
              styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, '#000000');
            }
          });
          // Also check inline cssText on elements
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes('oklch')) {
              htmlEl.style.cssText = htmlEl.style.cssText.replace(/oklch\([^)]+\)/g, '#000000');
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');
      
      // 58mm width in points or mm. 58mm = approx 58mm width, dynamic height
      const pdfWidthMm = 58;
      const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidthMm, Math.max(pdfHeightMm, 80)],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm);
      pdf.save(`Ticket_58mm_${plate}_${ticketNumber}.pdf`);
    } catch (err) {
      console.error('Error generating 58mm thermal PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0d0d1a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800 font-sans text-slate-200 overflow-y-auto max-h-[90vh]">
        
        {/* Header Action */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">
              {isEntryTicket ? 'Ticket de Ingreso (58mm)' : 'Comprobante de Pago (58mm)'}
            </h3>
            <p className="text-[10px] text-slate-400">Configurado para impresoras térmicas de 58mm</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Ticket Container (printable & capturable as PDF) */}
        <div className="flex justify-center bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
          
          <div
            ref={ticketRef}
            className="bg-white text-black p-4 rounded-md shadow-md text-center font-mono leading-tight max-w-[240px] w-full"
            style={{ width: '220px', color: '#000000', backgroundColor: '#ffffff', fontSize: `${fontSizePx}px` }}
          >
            {/* Logo if configured */}
            {showTicketLogo && ticketLogo && (
              <div className="mb-2 flex justify-center">
                <img src={ticketLogo} alt="Logo Ticket" className="max-h-12 w-auto object-contain" />
              </div>
            )}

            <div className="border-b-2 border-dashed border-black pb-2 mb-2 text-center leading-snug">
              <h4 className="font-black uppercase tracking-tight text-center" style={{ fontSize: `${fontSizePx + 2}px` }}>{headerText}</h4>
              <p className="font-bold text-gray-800 mt-0.5" style={{ fontSize: `${fontSizePx}px` }}>Rut: {companyRut}</p>
              <p className="text-gray-800" style={{ fontSize: `${fontSizePx - 1}px` }}>{companyAddress}</p>
              <p className="font-bold text-gray-800 uppercase" style={{ fontSize: `${fontSizePx - 1}px` }}>{companySii}</p>
              
              {/* Header Title: Boleta N° for Exit Ticket, TICKET DE INGRESO for Entry Ticket */}
              {transaction ? (
                <p className="font-black mt-1 uppercase text-black pt-1 border-t border-gray-300" style={{ fontSize: `${fontSizePx + 1}px` }}>
                  BOLETA N° {transaction.boletaNumber || 3500}
                </p>
              ) : (
                <p className="font-black mt-1 uppercase text-black pt-1 border-t border-gray-300" style={{ fontSize: `${fontSizePx + 1}px` }}>
                  TICKET DE INGRESO
                </p>
              )}
            </div>

            {/* TEXTO DESTACADO DEL TICKET */}
            {featuredText && (
              <div
                className="my-2 p-1.5 border-2 border-black bg-yellow-100 font-extrabold uppercase text-center tracking-tight leading-tight rounded-xs"
                style={{ fontSize: `${Math.max(8, fontSizePx - 1)}px` }}
              >
                ★ {featuredText} ★
              </div>
            )}

            <div className="py-1 text-left space-y-1" style={{ fontSize: `${fontSizePx}px` }}>
              {/* N° Ticket ONLY for Entry Ticket (control interno) */}
              {isEntryTicket && (
                <div className="flex justify-between">
                  <span className="font-bold">Nº TICKET:</span>
                  <span className="font-extrabold">{ticketNumber}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="font-bold">FECHA/HORA:</span>
                <span>{dateStr}</span>
              </div>

              <div className="flex justify-between items-center py-1 my-1 border-y border-gray-300">
                <span className="font-bold">PATENTE:</span>
                <span className="font-black px-2 py-0.5 bg-gray-200 border border-black rounded" style={{ fontSize: `${fontSizePx + 1}px` }}>{plate}</span>
              </div>

              {/* Vehicle Specs (Marca, Modelo, Color) for Entry Ticket */}
              {isEntryTicket && vehicle && (vehicle.make || vehicle.model) && (
                <div className="flex justify-between">
                  <span className="font-bold">VEHÍCULO:</span>
                  <span className="font-bold uppercase text-right">{vehicle.make} {vehicle.model}</span>
                </div>
              )}
              {isEntryTicket && vehicle && vehicle.color && (
                <div className="flex justify-between">
                  <span className="font-bold">COLOR:</span>
                  <span className="font-bold uppercase">{vehicle.color}</span>
                </div>
              )}

              {vehicle && (
                <div className="flex justify-between">
                  <span className="font-bold">ESPACIO:</span>
                  <span className="font-bold">{vehicle.spotId}</span>
                </div>
              )}
              {vehicle && (
                <div className="flex justify-between">
                  <span className="font-bold">MODALIDAD:</span>
                  <span className="font-bold uppercase">
                    {vehicle.chargingMode === 'tramo' ? 'Por Tramo' : vehicle.chargingMode === 'nocturno' ? 'Nocturno' : 'Por Minuto'}
                  </span>
                </div>
              )}
              {vehicle && vehicle.driverName && (
                <div className="flex justify-between">
                  <span className="font-bold">CONDUCTOR:</span>
                  <span className="font-bold">{vehicle.driverName}</span>
                </div>
              )}
            </div>

            {/* Details list & payment summary if exit transaction */}
            {transaction && (
              <div className="border-t border-b-2 border-dashed border-black py-2 text-left space-y-1.5 my-2" style={{ fontSize: `${Math.max(8.5, fontSizePx - 1)}px` }}>
                <span className="font-extrabold block uppercase mb-1 border-b border-gray-300 pb-0.5 text-center">
                  Detalle del servicio o producto
                </span>
                
                <div className="space-y-1 pl-1 font-mono font-medium">
                  {transaction.itemDetails.map((detail, idx) => (
                    <div key={idx} className="leading-snug">
                      * {detail}
                    </div>
                  ))}
                </div>

                {/* DESGLOSE FISCAL E IMPUESTOS */}
                <div className="pt-2 border-t border-gray-400 mt-2 space-y-0.5 text-gray-800 font-sans">
                  <div className="flex justify-between">
                    <span>monto neto:</span>
                    <span className="font-bold">{formatCurrency(netAmt)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-black">
                    <span>IVA:</span>
                    <span>{formatCurrency(vatAmt)}</span>
                  </div>
                  <div className="flex justify-between font-black text-black text-sm pt-0.5 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(transaction.total)}</span>
                  </div>
                </div>

                {/* DETALLE DEL PAGO */}
                <div className="bg-gray-100 p-1.5 border border-black rounded-xs my-1 space-y-1 font-sans">
                  <div className="flex justify-between font-bold">
                    <span>Forma de pago:</span>
                    <span className="uppercase text-black">{transaction.paymentMethod}</span>
                  </div>

                  {transaction.paymentReference && (
                    <div className="flex justify-between text-[10px] font-extrabold text-black pt-0.5 border-t border-gray-300">
                      <span>Cod. Confirmación:</span>
                      <span className="font-mono uppercase">{transaction.paymentReference}</span>
                    </div>
                  )}
                  
                  {paidAmt > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span>Monto Pagado:</span>
                      <span className="font-bold">{formatCurrency(paidAmt)}</span>
                    </div>
                  )}

                  {transaction.paymentMethod === 'efectivo' && (
                    <div className="flex justify-between font-bold text-black pt-0.5 border-t border-gray-300 text-[10px]">
                      <span>Vuelto:</span>
                      <span>{formatCurrency(changeAmt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QR Code / Barcode section - SOLO PARA TICKET DE ENTRADA */}
            {showQr && !transaction && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-center my-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=AUTOPARK-${plate}-${ticketNumber}`}
                    alt="QR Ticket Entrada"
                    className="w-20 h-20 border border-black p-1"
                  />
                </div>
                <p className="text-[8px] leading-tight text-gray-700 font-sans mt-1">
                  {footerText}
                </p>
              </div>
            )}

            {/* Pie de página sin QR para ticket de salida / boleta */}
            {transaction && (
              <div className="pt-2 text-center border-t border-gray-300 mt-2">
                <p className="text-[8px] leading-tight text-gray-700 font-sans">
                  {footerText}
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs cursor-pointer"
          >
            Cerrar
          </button>
          
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/50 disabled:opacity-50"
          >
            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Descargar PDF (58mm)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>

      </div>
    </div>
  );
};
