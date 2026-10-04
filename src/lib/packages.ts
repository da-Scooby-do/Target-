export const packageTypes = ["pallet", "box", "crate", "container20", "container40", "other"] as const;
export type PackageType = (typeof packageTypes)[number];

export type PackageLine = {
  qty: number;
  type: PackageType;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
};

/** Pieces, total kilograms and cubic metres across all package lines. */
export function packageTotals(lines: PackageLine[]) {
  let pieces = 0;
  let kg = 0;
  let cbm = 0;
  for (const p of lines) {
    const qty = p.qty || 0;
    pieces += qty;
    kg += qty * (p.weight ?? 0);
    if (p.length && p.width && p.height) cbm += (qty * p.length * p.width * p.height) / 1_000_000;
  }
  return { pieces, kg: Math.round(kg * 10) / 10, cbm: Math.round(cbm * 100) / 100 };
}
