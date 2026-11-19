/**
 * Integer paise arithmetic (1 INR = 100 paise)
 */
export function toPaise(amount: number): number {
  return Math.round((Number(amount) || 0) * 100);
}

export function fromPaise(paise: number): number {
  return (Math.round(paise) || 0) / 100;
}

export function formatINR(amount: number, showDecimals: boolean = true): string {
  const safe = Number(amount) || 0;
  const isNeg = safe < 0;
  const abs = Math.abs(safe);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(abs);

  return isNeg ? `-${formatted}` : formatted;
}

export function formatINRCompact(amount: number): string {
  const safe = Number(amount) || 0;
  const isNeg = safe < 0;
  const abs = Math.abs(safe);

  let str = '';
  if (abs >= 10000000) str = `₹${(abs / 10000000).toFixed(2)} Cr`;
  else if (abs >= 100000) str = `₹${(abs / 100000).toFixed(2)} L`;
  else if (abs >= 1000) str = `₹${(abs / 1000).toFixed(1)} K`;
  else str = `₹${abs.toFixed(0)}`;

  return isNeg ? `-${str}` : str;
}
