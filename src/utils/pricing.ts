import { ActiveVehicle, RateConfig, VehicleType } from '../types';

export function calculateParkingFee(
  entryTimeIso: string,
  chargingMode: 'minuto' | 'tramo' | 'nocturno',
  config: RateConfig,
  vehicleType: VehicleType = 'auto',
  exitTimeIso?: string,
  nightsOverride?: number
): {
  elapsedMinutes: number;
  billableMinutes: number;
  parkingFee: number;
  breakdownText: string;
  blocksCalculated?: { firstBlock: boolean; extraBlocks: number };
} {
  const start = new Date(entryTimeIso).getTime();
  const end = exitTimeIso ? new Date(exitTimeIso).getTime() : Date.now();
  
  const diffMs = Math.max(0, end - start);
  const elapsedMinutes = Math.floor(diffMs / (1000 * 60));

  const multiplier = config.typeMultipliers?.[vehicleType] ?? 1.0;
  const grace = config.gracePeriodMinutes || 0;

  if (chargingMode === 'nocturno') {
    const hoursElapsed = elapsedMinutes / 60;
    // Calculate nights based on 12-hour pernocte cycle or explicit nightsOverride
    const calculatedNights = nightsOverride || Math.max(1, Math.ceil(hoursElapsed / 12));
    const baseRate = config.nightlyRate || 8000;
    const parkingFee = Math.round(calculatedNights * baseRate * multiplier);

    return {
      elapsedMinutes,
      billableMinutes: elapsedMinutes,
      parkingFee,
      breakdownText: `Pernocte ${calculatedNights} noche(s) valor ${formatCurrency(parkingFee)}`,
    };
  }

  if (elapsedMinutes <= grace) {
    return {
      elapsedMinutes,
      billableMinutes: 0,
      parkingFee: 0,
      breakdownText: `0 minutos valor $0 (gracia ${grace} min)`,
      blocksCalculated: { firstBlock: false, extraBlocks: 0 }
    };
  }

  const billableMinutes = elapsedMinutes;

  // Regla de negocio por TRAMOS FIJOS
  // Primer tramo (mínimo 30 minutos) = $900
  // Tramos extras a partir del minuto 31 = $300 por cada bloque de 10 min o fracción de bloque
  const firstBlockMins = Math.max(30, config.firstBlockMinutes || 30);
  const firstPrice = config.firstBlockPrice ?? 900;
  const subMins = Math.max(1, config.subsequentBlockMinutes || 10);
  const subPrice = config.subsequentBlockPrice ?? 300;

  if (billableMinutes <= firstBlockMins) {
    const parkingFee = Math.round(firstPrice * multiplier);
    return {
      elapsedMinutes,
      billableMinutes,
      parkingFee,
      breakdownText: `1º Tramo (${firstBlockMins} min) valor ${formatCurrency(parkingFee)}`,
      blocksCalculated: { firstBlock: true, extraBlocks: 0 }
    };
  } else {
    const extraMinutes = billableMinutes - firstBlockMins;
    const extraBlocks = Math.ceil(extraMinutes / subMins);
    const totalRaw = firstPrice + (extraBlocks * subPrice);
    const parkingFee = Math.round(totalRaw * multiplier);
    return {
      elapsedMinutes,
      billableMinutes,
      parkingFee,
      breakdownText: `1º Tramo (${firstBlockMins}m) + ${extraBlocks} tramo(s) extra (${subMins}m) = ${formatCurrency(parkingFee)}`,
      blocksCalculated: { firstBlock: true, extraBlocks }
    };
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
