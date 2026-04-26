const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number): string {
  return NGN.format(amount);
}

const NUM = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatPriceNGN(amount: number): string {
  return `NGN${NUM.format(amount)}`;
}
