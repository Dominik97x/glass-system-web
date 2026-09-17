export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format księgowy używany dla cen netto, kwot VAT i dokładnych cen brutto.
 * Zawsze pokazuje grosze, aby panel administracyjny i dokumenty nie ukrywały
 * różnic wynikających z podatku oraz zaokrągleń.
 */
export function formatAccountingPrice(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
